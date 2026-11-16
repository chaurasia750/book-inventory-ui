import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LedgerService, ReturnService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CreditNoteSummary, REFUND_MODES, RefundMade, RefundMode } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, DatePickerComponent, SchoolSelectComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';

/**
 * The form for a new refund, shown in the panel beside the list (platform U10, sales spec R64-R66, R67): the school with the credit
 * the company owes it, the amount, the way it is paid (Cash, UPI or Bank transfer), the reference of a UPI or bank payment, the
 * date, the credit note it settles (optional) and a remark. Only the Owner reaches it. The screen shows the limit (the school's
 * credit); the API checks it again and its message is shown on a refusal.
 */
@Component({
  selector: 'app-refund-add',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, DatePickerComponent, SchoolSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'refunds.add.title' | translate }}</h1>
        <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
      </div>
      <app-card>
        <form class="space-y-4" (submit)="$event.preventDefault(); save()">
          <div>
            <label for="rf-school" class="${LABEL}">{{ 'returns.fields.school' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <app-school-select inputId="rf-school" [formControl]="school" [activeOnly]="false" [placeholder]="'counter.fields.noSchool' | translate"
              [searchPlaceholder]="'counter.fields.searchSchool' | translate" [emptyLabel]="'counter.fields.noSchoolFound' | translate" (picked)="schoolChosen()" />
            @if (school.value) {
              <p class="mt-1 text-xs" [class.text-emerald-700]="credit() > 0" [class.text-gray-500]="credit() <= 0">
                {{ (credit() > 0 ? 'refunds.fields.credit' : 'refunds.fields.noCredit') | translate }}@if (credit() > 0) { <span class="font-mono font-semibold"> {{ credit() | number: '1.2-2' }}</span> }
              </p>
            }
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="rf-amount" class="${LABEL}">{{ 'refunds.fields.amount' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="rf-amount" type="number" min="0" step="0.01" [formControl]="amount" class="${FIELD}" />
            </div>
            <div>
              <label for="rf-mode" class="${LABEL}">{{ 'refunds.fields.mode' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <select id="rf-mode" [formControl]="mode" class="${FIELD}">
                @for (m of modes; track m) { <option [value]="m">{{ 'refunds.mode.' + m | translate }}</option> }
              </select>
            </div>
            @if (mode.value !== 'CASH') {
              <div>
                <label for="rf-ref" class="${LABEL}">{{ (mode.value === 'UPI' ? 'refunds.fields.upiRef' : 'refunds.fields.bankRef') | translate }}</label>
                <input id="rf-ref" [formControl]="reference" maxlength="50" class="${FIELD}" />
              </div>
            }
            <div>
              <label for="rf-date" class="${LABEL}">{{ 'refunds.fields.date' | translate }}</label>
              <app-date-picker inputId="rf-date" [formControl]="refundDate" />
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="rf-note" class="${LABEL}">{{ 'refunds.fields.creditNote' | translate }}</label>
              <select id="rf-note" [formControl]="creditNote" class="${FIELD}" [disabled]="!school.value">
                <option value="">{{ 'refunds.fields.noCreditNote' | translate }}</option>
                @for (n of notes(); track n.id) { <option [value]="n.id">{{ n.number }} · {{ n.noteDate }} · {{ n.grandTotal | number: '1.2-2' }}</option> }
              </select>
            </div>
            <div>
              <label for="rf-remark" class="${LABEL}">{{ 'returns.fields.remark' | translate }}</label>
              <input id="rf-remark" [formControl]="remark" maxlength="500" class="${FIELD}" />
            </div>
          </div>
          @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
          <div class="flex justify-end gap-2">
            <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="!canSave()">{{ 'refunds.add.submit' | translate }}</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class RefundAddComponent {
  private readonly returns = inject(ReturnService);
  private readonly ledger = inject(LedgerService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly created = output<RefundMade>();
  readonly closed = output<void>();

  readonly modes = REFUND_MODES;
  readonly school = new FormControl('', { nonNullable: true });
  readonly amount = new FormControl('', { nonNullable: true });
  readonly mode = new FormControl<RefundMode>('CASH', { nonNullable: true });
  readonly reference = new FormControl('', { nonNullable: true });
  readonly refundDate = new FormControl('', { nonNullable: true });
  readonly creditNote = new FormControl('', { nonNullable: true });
  readonly remark = new FormControl('', { nonNullable: true });

  /** R65: what the company owes the school (its balance below zero); zero when the school owes the company. */
  readonly credit = signal(0);
  readonly notes = signal<CreditNoteSummary[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');

  canSave(): boolean {
    return !!this.school.value && Number(this.amount.value) > 0;
  }

  /** R65: shows the school's credit and its live credit notes; the credit note is only a link for the reader (R64). */
  schoolChosen(): void {
    this.creditNote.setValue('');
    this.notes.set([]);
    this.credit.set(0);
    if (!this.school.value) return;
    const id = this.school.value;
    this.ledger.balances('schools', [id]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (b) => this.credit.set(Math.max(0, -(b[id] ?? 0))), error: () => this.credit.set(0) });
    this.returns.creditNotes({ schoolId: id, status: 'ACTIVE', pageIndex: 1, pageSize: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (p) => this.notes.set(p.items), error: () => this.notes.set([]) });
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.returns
      .recordRefund({
        schoolId: this.school.value,
        amount: Number(this.amount.value),
        mode: this.mode.value,
        reference: this.mode.value === 'CASH' ? undefined : this.reference.value.trim() || undefined,
        refundDate: this.refundDate.value || undefined,
        creditNoteId: this.creditNote.value || undefined,
        remark: this.remark.value.trim() || undefined,
      })
      .subscribe({
        next: (made) => {
          this.saving.set(false);
          this.created.emit(made);
        },
        error: (e: unknown) => {
          this.saving.set(false);
          this.error.set(messageForError(e, this.translate));
        },
      });
  }
}
