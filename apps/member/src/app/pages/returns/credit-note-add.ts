import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ReturnService, SalesService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  CREDIT_NOTE_REASONS,
  CreditNoteLineRequest,
  CreditNoteMade,
  CreditNoteReason,
  InvoiceSummary,
  ItemSummary,
  RETURN_CONDITIONS,
  ReturnCondition,
} from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, DatePickerComponent, SchoolSelectComponent } from '@org/ui';
import { ItemEntryComponent } from '../sales/item-entry';
import { MoneyPipe } from '../counters/money.pipe';
import { MoneyPrefixComponent } from '../counters/money-prefix';

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';

/** One line the user is filling: from an invoice line (with its sold and returned counts) or from an item picked without an invoice. */
interface ReturnRow {
  key: string;
  itemId: string;
  invoiceLineId: string | null;
  name: string;
  code: string;
  sold: number | null;
  returned: number | null;
  quantity: string;
  condition: ReturnCondition;
  rate: string;
}

/**
 * The form for a new credit note (a school return), shown in the panel beside the list (platform U10, sales spec R53-R57, R64): the
 * school, an optional invoice (its lines are listed with what is still returnable) or items searched like the order editor, the
 * quantity and condition (Good or Damaged) of each line, the reason and the date. The totals are the server's: the credit note made
 * shows them (no amount is worked out on the screen). Returning more than was sold is a yellow warning shown after saving, never a refusal.
 */
@Component({
  selector: 'app-credit-note-add',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, DatePickerComponent, SchoolSelectComponent, ItemEntryComponent, MoneyPipe, MoneyPrefixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'returns.add.title' | translate }}</h1>
        <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
      </div>
      <app-card>
        <form class="space-y-4" (submit)="$event.preventDefault(); save()">
          <div>
            <label for="cn-school" class="${LABEL}">{{ 'returns.fields.school' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <app-school-select inputId="cn-school" [formControl]="school" [activeOnly]="false" [placeholder]="'counter.fields.noSchool' | translate"
              [searchPlaceholder]="'counter.fields.searchSchool' | translate" [emptyLabel]="'counter.fields.noSchoolFound' | translate" (picked)="schoolChosen()" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="cn-invoice" class="${LABEL}">{{ 'returns.fields.invoice' | translate }}</label>
              <select id="cn-invoice" [formControl]="invoice" (change)="invoiceChosen()" class="${FIELD}" [disabled]="!school.value">
                <option value="">{{ 'returns.fields.noInvoice' | translate }}</option>
                @for (i of invoices(); track i.id) { <option [value]="i.id">{{ i.number }} · {{ i.invoiceDate }} · {{ i.grandTotal | money }}</option> }
              </select>
            </div>
            <div>
              <label for="cn-date" class="${LABEL}">{{ 'returns.fields.date' | translate }}</label>
              <app-date-picker inputId="cn-date" [formControl]="noteDate" />
            </div>
          </div>

          @if (school.value) {
            @if (!invoice.value) {
              <div class="min-w-[16rem]"><app-item-entry (picked)="addItem($event)" /></div>
            }
            @if (rows().length === 0) {
              <p class="m-0 rounded-lg border border-dashed border-neutral-300 px-3 py-4 text-center text-sm text-gray-500">{{ (invoice.value ? 'returns.lines.noneInvoice' : 'returns.lines.noneItem') | translate }}</p>
            } @else {
              <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
                <table class="w-full min-w-[560px] text-left text-xs">
                  <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
                    <tr>
                      <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                      @if (invoice.value) { <th class="px-3 py-2 text-right font-semibold">{{ 'returns.lines.sold' | translate }}</th><th class="px-3 py-2 text-right font-semibold">{{ 'returns.lines.returnable' | translate }}</th> }
                      @else { <th class="px-3 py-2 text-right font-semibold">{{ 'returns.lines.rate' | translate }}</th> }
                      <th class="w-24 px-3 py-2 text-right font-semibold">{{ 'sales.columns.qty' | translate }}</th>
                      <th class="w-32 px-3 py-2 font-semibold">{{ 'returns.lines.condition' | translate }}</th>
                      @if (!invoice.value) { <th class="w-8"></th> }
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
                    @for (row of rows(); track row.key) {
                      <tr>
                        <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ row.name }}</span> <span class="ml-1 font-mono text-gray-500">{{ row.code }}</span></td>
                        @if (invoice.value) {
                          <td class="px-3 py-2 text-right">{{ row.sold }}</td>
                          <td class="px-3 py-2 text-right">{{ (row.sold ?? 0) - (row.returned ?? 0) }}</td>
                        } @else {
                          <td class="px-3 py-2 text-right"><app-money-prefix [inline]="true"><input type="number" min="0" step="0.01" [value]="row.rate" [placeholder]="'returns.lines.rateAuto' | translate" (input)="patch(row.key, { rate: $any($event.target).value })" class="h-9 w-24 rounded-lg border border-gray-300 px-2 text-right text-sm" /></app-money-prefix></td>
                        }
                        <td class="px-3 py-2 text-right"><input type="number" min="0" step="1" [value]="row.quantity" [attr.aria-label]="'sales.columns.qty' | translate" (input)="patch(row.key, { quantity: $any($event.target).value })" class="h-9 w-20 rounded-lg border border-gray-300 px-2 text-right text-sm" /></td>
                        <td class="px-3 py-2">
                          <select [value]="row.condition" [attr.aria-label]="'returns.lines.condition' | translate" (change)="patch(row.key, { condition: $any($event.target).value })" class="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                            @for (c of conditions; track c) { <option [value]="c">{{ 'returns.condition.' + c | translate }}</option> }
                          </select>
                        </td>
                        @if (!invoice.value) { <td class="px-1"><button type="button" class="text-gray-400 hover:text-red-600" [attr.aria-label]="'returns.lines.remove' | translate" (click)="remove(row.key)">✕</button></td> }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="cn-reason" class="${LABEL}">{{ 'returns.fields.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <select id="cn-reason" [formControl]="reason" class="${FIELD}">
                @for (r of reasons; track r) { <option [value]="r">{{ 'returns.reason.' + r | translate }}</option> }
              </select>
            </div>
            <div>
              <label for="cn-remark" class="${LABEL}">{{ 'returns.fields.remark' | translate }}@if (reason.value === 'OTHER') { <span class="text-red-500" aria-hidden="true"> *</span> }</label>
              <input id="cn-remark" [formControl]="remark" maxlength="500" class="${FIELD}" />
            </div>
          </div>
          @if (!invoice.value) {
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [formControl]="gst" /> {{ 'returns.fields.gst' | translate }}</label>
          }

          @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
          <div class="flex justify-end gap-2">
            <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="!canSave()">{{ 'returns.add.submit' | translate }}</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class CreditNoteAddComponent {
  private readonly returns = inject(ReturnService);
  private readonly sales = inject(SalesService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly created = output<CreditNoteMade>();
  readonly closed = output<void>();

  readonly reasons = CREDIT_NOTE_REASONS;
  readonly conditions = RETURN_CONDITIONS;

  readonly school = new FormControl('', { nonNullable: true });
  readonly invoice = new FormControl('', { nonNullable: true });
  readonly noteDate = new FormControl('', { nonNullable: true });
  readonly reason = new FormControl<CreditNoteReason>('SESSION_END', { nonNullable: true });
  readonly remark = new FormControl('', { nonNullable: true });
  readonly gst = new FormControl(false, { nonNullable: true });

  readonly invoices = signal<InvoiceSummary[]>([]);
  readonly rows = signal<ReturnRow[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');

  canSave(): boolean {
    return !!this.school.value && this.rows().some((r) => Number(r.quantity) > 0);
  }

  /** R53: the school's live invoices can be chosen; changing the school clears the invoice and the lines. */
  schoolChosen(): void {
    this.invoice.setValue('');
    this.rows.set([]);
    this.invoices.set([]);
    if (!this.school.value) return;
    this.sales
      .invoices({ schoolId: this.school.value, status: 'ISSUED', pageIndex: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (page) => this.invoices.set(page.items), error: (e: unknown) => this.error.set(messageForError(e, this.translate)) });
  }

  /** R54: with an invoice the lines are the invoice's (what was sold and what is still returnable); without one the user searches items. */
  invoiceChosen(): void {
    this.rows.set([]);
    if (!this.invoice.value) return;
    this.returns.invoiceReturns(this.invoice.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) =>
        this.rows.set(
          r.lines.map((l) => ({
            key: l.invoiceLineId, itemId: l.itemId, invoiceLineId: l.invoiceLineId, name: l.itemName, code: l.itemCode,
            sold: l.soldQuantity, returned: l.returnedQuantity, quantity: '', condition: 'GOOD', rate: '',
          })),
        ),
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }

  addItem(item: ItemSummary): void {
    const existing = this.rows().find((r) => r.itemId === item.id);
    if (existing) {
      this.patch(existing.key, { quantity: String(Number(existing.quantity || 0) + 1) });
      return;
    }
    this.rows.update((rows) => [...rows, { key: item.id, itemId: item.id, invoiceLineId: null, name: item.name, code: item.code, sold: null, returned: null, quantity: '1', condition: 'GOOD', rate: '' }]);
  }

  patch(key: string, change: Partial<ReturnRow>): void {
    this.rows.update((rows) => rows.map((r) => (r.key === key ? { ...r, ...change } : r)));
  }

  remove(key: string): void {
    this.rows.update((rows) => rows.filter((r) => r.key !== key));
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.returns
      .makeCreditNote({
        schoolId: this.school.value,
        reason: this.reason.value,
        invoiceId: this.invoice.value || undefined,
        noteDate: this.noteDate.value || undefined,
        isGstApplied: this.invoice.value ? undefined : this.gst.value || undefined,
        remark: this.remark.value.trim() || undefined,
        lines: this.rows().filter((r) => Number(r.quantity) > 0).map((r) => this.lineOf(r)),
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

  private lineOf(row: ReturnRow): CreditNoteLineRequest {
    return {
      quantity: Number(row.quantity),
      condition: row.condition,
      invoiceLineId: row.invoiceLineId ?? undefined,
      itemId: row.invoiceLineId ? undefined : row.itemId,
      rate: !row.invoiceLineId && row.rate !== '' ? Number(row.rate) : undefined,
    };
  }
}
