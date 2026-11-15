import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ReceiptDetail } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

/**
 * One receipt (payment spec R16): its number, date, school, status, modes with their references and cheque status, what it was
 * applied to and the advance. Read-only here; cheque results, adjusting and cancelling come with their own screens.
 */
@Component({
  selector: 'app-receipt-detail-dialog',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslatePipe, ButtonComponent, ModalComponent],
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
                    } @else { {{ m.reference || '-' }} }
                  </td>
                  <td class="py-1.5 text-right font-mono">{{ m.amount | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
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
        </div>
      }
    </app-modal>
  `,
})
export class ReceiptDetailDialogComponent {
  /** The receipt to show; the dialog is closed while this is null. */
  readonly receiptId = input<string | null>(null);
  readonly closed = output<void>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly receipt = signal<ReceiptDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    effect(() => {
      if (this.receiptId() !== null) {
        untracked(() => this.load());
      }
    });
  }

  load(): void {
    const id = this.receiptId();
    if (id === null) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
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
