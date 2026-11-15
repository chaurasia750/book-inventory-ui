import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ButtonComponent } from '@org/ui';

/**
 * Cancels a receipt (payment spec R14, BR-LED-05: nothing posted is deleted): a reason of 5 to 500 characters is required; the
 * server reverses the ledger entry, takes the allocations back and refuses it when a cheque of the receipt has a result.
 */
@Component({
  selector: 'app-cancel-receipt-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2 rounded-lg border border-red-200 p-3" role="group" [attr.aria-label]="'payment.cancel.title' | translate">
      <p class="m-0 text-sm font-semibold">{{ 'payment.cancel.title' | translate }}</p>
      <p class="m-0 text-xs text-gray-600">{{ 'payment.cancel.hint' | translate }}</p>
      <div>
        <label for="cr-reason" class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'payment.cancel.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
        <input id="cr-reason" [formControl]="reason" maxlength="500" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm" />
      </div>
      @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
      <div class="flex justify-end gap-2">
        <app-button size="sm" variant="secondary" (clicked)="cancelled.emit()">{{ 'users.cancel' | translate }}</app-button>
        <app-button size="sm" variant="danger" [loading]="saving()" (clicked)="save()">{{ 'payment.cancel.confirm' | translate }}</app-button>
      </div>
    </div>
  `,
})
export class CancelReceiptPanelComponent {
  readonly receiptId = input.required<string>();
  /** The receipt was cancelled. */
  readonly done = output<void>();
  readonly cancelled = output<void>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly reason = new FormControl('', { nonNullable: true });
  readonly saving = signal(false);
  readonly error = signal('');

  save(): void {
    this.saving.set(true);
    this.error.set('');
    this.payments.cancelReceipt(this.receiptId(), this.reason.value.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.done.emit();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
