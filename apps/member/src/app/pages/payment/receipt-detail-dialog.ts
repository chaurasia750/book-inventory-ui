import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ReceiptDetail } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';
import { AdjustAdvancePanelComponent } from './adjust-advance-panel';
import { CancelReceiptPanelComponent } from './cancel-receipt-panel';
import { ReceiptProofsComponent } from './receipt-proofs';

/** Today as `yyyy-MM-dd` in the browser's own time zone (the business date the Owner sees). */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * One receipt (payment spec R16): its number, date, school, status, modes with their references and cheque status, what it was
 * applied to and the advance. A pending cheque has Clear and Bounce (R10, R11); a recorded receipt can have its advance adjusted and be cancelled (R13, R14).
 */
@Component({
  selector: 'app-receipt-detail-dialog',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, ModalComponent, AdjustAdvancePanelComponent, CancelReceiptPanelComponent, ReceiptProofsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal size="wide" [open]="receiptId() !== null" [title]="'payment.detail.title' | translate" (closed)="closed.emit()">
      @if (loading()) {
        <p class="m-0 py-6 text-center text-sm text-gray-500">{{ 'payment.receive.loading' | translate }}</p>
      } @else if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (receipt(); as r) {
        <div class="space-y-4 text-sm">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold text-primary-fg" [class.line-through]="r.summary.status === 'CANCELLED'">{{ r.summary.number }}</span>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="r.summary.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">{{ 'payment.status.' + r.summary.status | translate }}</span>
            <span class="text-gray-600">{{ r.summary.receiptDate | date: 'dd MMM yyyy' }}</span>
            <span class="text-gray-600">{{ r.summary.schoolName }} <span class="font-mono text-xs">{{ r.summary.schoolCode }}</span></span>
          </div>
          <table class="w-full text-left text-xs">
            <thead class="text-[11px] uppercase tracking-[0.05em] text-gray-500">
              <tr>
                <th class="py-1 pr-3 font-semibold">{{ 'payment.receive.mode' | translate }}</th>
                <th class="py-1 pr-3 font-semibold">{{ 'payment.detail.reference' | translate }}</th>
                <th class="py-1 text-right font-semibold">{{ 'payment.receive.amount' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-charcoal-700">
              @for (m of r.modes; track m.id) {
                <tr>
                  <td class="py-1.5 pr-3">{{ 'payment.mode.' + m.type | translate }}</td>
                  <td class="py-1.5 pr-3 text-gray-600">
                    @if (m.type === 'CHEQUE') {
                      {{ m.chequeNumber }} · {{ m.chequeDate | date: 'dd MMM yy' }} · {{ m.bankName }}
                      @if (m.chequeStatus) { <span class="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold">{{ 'payment.cheque.' + m.chequeStatus | translate }}</span> }
                      @if (m.chequeStatus === 'PENDING' && r.summary.status === 'RECORDED') {
                        <span class="ml-2 inline-flex gap-1">
                          <app-button size="sm" variant="secondary" (clicked)="startAction(m.id, 'clear')">{{ 'payment.cheque.clearAction' | translate }}</app-button>
                          <app-button size="sm" variant="secondary" (clicked)="startAction(m.id, 'bounce')">{{ 'payment.cheque.bounceAction' | translate }}</app-button>
                        </span>
                      }
                    } @else { {{ m.reference || '-' }} }
                  </td>
                  <td class="py-1.5 text-right font-mono">{{ m.amount | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
          @if (action(); as a) {
            <div class="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-charcoal-700" role="group" [attr.aria-label]="'payment.cheque.' + a.kind + 'Action' | translate">
              <p class="m-0 text-sm font-semibold">{{ 'payment.cheque.' + a.kind + 'Action' | translate }}</p>
              <div class="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <div>
                  <label for="cq-date" class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'payment.cheque.date' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
                  <input id="cq-date" type="date" [formControl]="actionDate" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm" />
                </div>
                @if (a.kind === 'bounce') {
                  <div>
                    <label for="cq-reason" class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'payment.cheque.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
                    <input id="cq-reason" [formControl]="actionReason" maxlength="500" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm" />
                  </div>
                }
              </div>
              @if (actionError()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ actionError() }}</p> }
              <div class="flex justify-end gap-2">
                <app-button size="sm" variant="secondary" (clicked)="action.set(null)">{{ 'users.cancel' | translate }}</app-button>
                <app-button size="sm" [loading]="acting()" (clicked)="saveAction()">{{ 'payment.cheque.save' | translate }}</app-button>
              </div>
            </div>
          }
          <div>
            <p class="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'payment.detail.appliedTo' | translate }}</p>
            @if (r.allocations.length === 0) {
              <p class="m-0 text-xs text-gray-500">{{ 'payment.detail.noAllocations' | translate }}</p>
            } @else {
              <ul class="m-0 list-none space-y-0.5 p-0 text-xs">
                @for (a of r.allocations; track a.invoiceId) {
                  <li class="flex justify-between gap-3"><span class="font-mono">{{ a.invoiceNumber || a.invoiceId }}</span><span class="font-mono">{{ a.amount | number: '1.2-2' }}</span></li>
                }
              </ul>
            }
          </div>
          <div class="flex flex-wrap gap-x-6 gap-y-1 border-t border-neutral-200 pt-3 dark:border-charcoal-700">
            <span>{{ 'payment.detail.total' | translate }}: <span class="font-mono font-semibold">{{ r.summary.totalAmount | number: '1.2-2' }}</span></span>
            <span>{{ 'payment.detail.advance' | translate }}: <span class="font-mono">{{ r.advanceAmount | number: '1.2-2' }}</span></span>
          </div>
          @if (r.remark) { <p class="m-0 text-xs text-gray-600">{{ r.remark }}</p> }
          <app-receipt-proofs [receiptId]="r.summary.id" [proofs]="r.proofs ?? []" [canEdit]="r.summary.status === 'RECORDED'" (changed)="load()" />
          @if (r.summary.status === 'CANCELLED') {
            <p class="m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{{ 'payment.cancel.cancelledOn' | translate: { date: (r.cancelledOn | date: 'dd MMM yyyy'), reason: r.cancelReason } }}</p>
          }
          @if (r.summary.status === 'RECORDED') {
            @if (panel() === 'adjust') {
              <app-adjust-advance-panel [receipt]="r" (done)="afterPanel()" (cancelled)="panel.set(null)" />
            } @else if (panel() === 'cancel') {
              <app-cancel-receipt-panel [receiptId]="r.summary.id" (done)="afterPanel()" (cancelled)="panel.set(null)" />
            } @else {
              <div class="flex flex-wrap justify-end gap-2">
                @if (r.advanceAmount > 0) { <app-button size="sm" variant="secondary" (clicked)="panel.set('adjust')">{{ 'payment.adjust.button' | translate }}</app-button> }
                <app-button size="sm" variant="secondary" (clicked)="panel.set('cancel')">{{ 'payment.cancel.button' | translate }}</app-button>
              </div>
            }
          }
        </div>
      }
    </app-modal>
  `,
})
export class ReceiptDetailDialogComponent {
  /** The receipt to show; the dialog is closed while this is null. */
  readonly receiptId = input<string | null>(null);
  readonly closed = output<void>();
  /** A cheque result was saved: the school's list and balance reload. */
  readonly changed = output<void>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly receipt = signal<ReceiptDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  /** Payment R10: the cheque result being entered (clear or bounce) with its date and, for a bounce, its reason. */
  readonly action = signal<{ modeId: string; kind: 'clear' | 'bounce' } | null>(null);
  readonly acting = signal(false);
  readonly actionError = signal('');
  readonly actionDate = new FormControl(todayIso(), { nonNullable: true });
  readonly actionReason = new FormControl('', { nonNullable: true });
  /** Payment R13, R14: the advance or cancel panel under the receipt, if one is open. */
  readonly panel = signal<'adjust' | 'cancel' | null>(null);

  constructor() {
    effect(() => {
      if (this.receiptId() !== null) {
        untracked(() => this.load());
      }
    });
  }

  afterPanel(): void {
    this.panel.set(null);
    this.changed.emit();
    this.load();
  }

  startAction(modeId: string, kind: 'clear' | 'bounce'): void {
    this.actionError.set('');
    this.actionDate.setValue(todayIso());
    this.actionReason.setValue('');
    this.action.set({ modeId, kind });
  }

  saveAction(): void {
    const a = this.action();
    const receipt = this.receipt();
    if (!a || !receipt || !this.actionDate.value) {
      this.actionError.set(this.translate.instant('payment.cheque.dateRequired'));
      return;
    }

    this.acting.set(true);
    this.actionError.set('');
    const call =
      a.kind === 'clear'
        ? this.payments.clearCheque(receipt.summary.id, a.modeId, this.actionDate.value)
        : this.payments.bounceCheque(receipt.summary.id, a.modeId, this.actionDate.value, this.actionReason.value.trim());
    call.subscribe({
      next: () => {
        this.acting.set(false);
        this.action.set(null);
        this.changed.emit();
        this.load();
      },
      error: (e: unknown) => {
        this.acting.set(false);
        this.actionError.set(messageForError(e, this.translate));
      },
    });
  }

  load(): void {
    const id = this.receiptId();
    if (id === null) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.panel.set(null);
    this.receipt.set(null);
    this.payments.get(id).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
