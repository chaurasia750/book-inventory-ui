import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { MAX_RECEIPT_PROOFS, ReceiptProof, proofFileError } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

/**
 * The optional proof files of a receipt (payment spec R20): the list with Open and Remove, and, for a recorded receipt with room,
 * a field to add another (PNG, JPEG or PDF, at most 5 MB, at most 5 per receipt; the type and size are checked before the upload).
 * A file is opened through the API (it needs the sign-in) and shown in a new tab.
 */
@Component({
  selector: 'app-receipt-proofs',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2">
      <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'payment.proof.title' | translate }}</p>
      @if (proofs().length === 0) {
        <p class="m-0 text-xs text-gray-500">{{ 'payment.proof.none' | translate }}</p>
      } @else {
        <ul class="m-0 list-none space-y-1 p-0 text-xs">
          @for (p of proofs(); track p.id) {
            <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-2 py-1.5 dark:border-charcoal-700">
              <span class="min-w-0 truncate">{{ p.fileName }} <span class="text-gray-500">({{ p.sizeBytes / 1024 | number: '1.0-0' }} KB)</span></span>
              <span class="flex gap-1">
                <app-button size="sm" variant="secondary" [loading]="busyId() === p.id" (clicked)="open(p)">{{ 'payment.proof.open' | translate }}</app-button>
                @if (canEdit()) {
                  @if (removing() === p.id) {
                    <app-button size="sm" variant="danger" (clicked)="remove(p)">{{ 'payment.proof.confirmRemove' | translate }}</app-button>
                    <app-button size="sm" variant="ghost" (clicked)="removing.set(null)">{{ 'users.cancel' | translate }}</app-button>
                  } @else {
                    <app-button size="sm" variant="ghost" (clicked)="removing.set(p.id)">{{ 'payment.proof.remove' | translate }}</app-button>
                  }
                }
              </span>
            </li>
          }
        </ul>
      }
      @if (canEdit() && proofs().length < maxProofs) {
        <div>
          <label for="rp-file" class="mb-1 block text-xs text-gray-600">{{ 'payment.proof.add' | translate }}</label>
          <input id="rp-file" type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" (change)="add($any($event.target))"
            class="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm" />
        </div>
      }
      @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
    </div>
  `,
})
export class ReceiptProofsComponent {
  readonly receiptId = input.required<string>();
  readonly proofs = input.required<ReceiptProof[]>();
  /** True for a recorded receipt: the Owner may add and remove (payment R20). */
  readonly canEdit = input(false);
  /** A proof was added or removed: the receipt reloads. */
  readonly changed = output<void>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly maxProofs = MAX_RECEIPT_PROOFS;
  readonly error = signal('');
  readonly busyId = signal<string | null>(null);
  readonly removing = signal<string | null>(null);

  add(input: HTMLInputElement): void {
    this.error.set('');
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    const problem = proofFileError(file);
    if (problem) {
      this.error.set(this.translate.instant(`payment.proof.${problem}`));
      input.value = '';
      return;
    }

    this.payments.uploadProof(this.receiptId(), file).subscribe({
      next: () => {
        input.value = '';
        this.changed.emit();
      },
      error: (e: unknown) => {
        input.value = '';
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  /** The tab is opened at once (inside the click, so the browser allows it) and the file is put in it when it arrives; a blocked tab downloads the file instead. */
  open(proof: ReceiptProof): void {
    this.error.set('');
    this.busyId.set(proof.id);
    const tab = window.open('', '_blank');
    this.payments.proofFile(this.receiptId(), proof.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        const url = URL.createObjectURL(blob);
        if (tab) {
          tab.location.href = url;
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.download = proof.fileName;
          link.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e: unknown) => {
        this.busyId.set(null);
        tab?.close();
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  remove(proof: ReceiptProof): void {
    this.error.set('');
    this.payments.removeProof(this.receiptId(), proof.id).subscribe({
      next: () => {
        this.removing.set(null);
        this.changed.emit();
      },
      error: (e: unknown) => {
        this.removing.set(null);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
