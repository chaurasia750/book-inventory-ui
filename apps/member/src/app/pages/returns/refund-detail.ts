import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ReturnService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Refund } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';

/**
 * One refund in the panel beside the refunds list (sales spec R64, R67, R68, R69): its number, date, school, amount, mode and
 * reference, the credit note it settles and the remark. Print and Download PDF give the A5 refund slip handed to the school (R68);
 * the Owner cancels with a reason (only the Owner reaches this screen, R67). A cancelled refund keeps its number and is struck through.
 */
@Component({
  selector: 'app-refund-detail',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (loading()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="space-y-3 rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800"><app-skeleton-loader width="14rem" /><app-skeleton-loader width="100%" /></div>
      } @else if (loadError()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ loadError() }}</span><app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (refund(); as r) {
        <section class="flex flex-col gap-3 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="m-0 font-mono text-lg font-semibold text-primary-fg" [class.line-through]="r.status === 'CANCELLED'">{{ r.number }}</h1>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(r.status)">{{ 'returns.status.' + r.status | translate }}</span>
            </div>
            <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
          </div>
          <dl class="m-0 grid gap-1.5 text-sm sm:grid-cols-2">
            <div><dt class="text-xs text-gray-500">{{ 'returns.fields.school' | translate }}</dt><dd class="m-0">{{ r.schoolName }} <span class="font-mono text-xs">({{ r.schoolCode }})</span></dd></div>
            <div><dt class="text-xs text-gray-500">{{ 'refunds.detail.date' | translate }}</dt><dd class="m-0 font-mono">{{ r.refundDate }}</dd></div>
            <div><dt class="text-xs text-gray-500">{{ 'refunds.fields.amount' | translate }}</dt><dd class="m-0 font-mono text-base font-semibold" [class.line-through]="r.status === 'CANCELLED'">{{ r.amount | number: '1.2-2' }}</dd></div>
            <div><dt class="text-xs text-gray-500">{{ 'refunds.fields.mode' | translate }}</dt><dd class="m-0">{{ 'refunds.mode.' + r.mode | translate }}@if (r.reference) { <span class="font-mono text-xs"> · {{ r.reference }}</span> }</dd></div>
            @if (r.creditNoteNumber) { <div><dt class="text-xs text-gray-500">{{ 'refunds.fields.creditNote' | translate }}</dt><dd class="m-0 font-mono">{{ r.creditNoteNumber }}</dd></div> }
            @if (r.remark) { <div class="sm:col-span-2"><dt class="text-xs text-gray-500">{{ 'returns.fields.remark' | translate }}</dt><dd class="m-0">{{ r.remark }}</dd></div> }
          </dl>
          <div class="flex flex-wrap gap-2">
            <app-button size="sm" variant="secondary" [loading]="busy()" (clicked)="print(r)">{{ 'refunds.detail.print' | translate }}</app-button>
            <app-button size="sm" [loading]="busy()" (clicked)="download(r)">{{ 'refunds.detail.downloadPdf' | translate }}</app-button>
            @if (r.status === 'ACTIVE') { <app-button size="sm" variant="secondary" (clicked)="openCancel()">{{ 'refunds.detail.cancel' | translate }}</app-button> }
          </div>
          @if (actionError()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ actionError() }}</p> }
          @if (r.status === 'CANCELLED' && r.cancelReason) {
            <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="status">{{ 'returns.detail.cancelled' | translate }}: {{ r.cancelReason }}@if (r.cancelledOn) { <span class="text-gray-500"> ({{ r.cancelledOn }})</span> }</p>
          }
        </section>

        <app-modal [open]="cancelOpen()" [title]="'refunds.detail.cancelTitle' | translate" (closed)="cancelOpen.set(false)">
          <div class="space-y-3">
            <p class="text-sm text-gray-600">{{ 'refunds.detail.cancelHint' | translate }}</p>
            <label for="rfd-reason" class="block text-sm font-semibold">{{ 'sales.editor.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <textarea id="rfd-reason" rows="3" [formControl]="reason" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea>
            @if (cancelError()) { <p class="text-xs text-red-600" role="alert">{{ cancelError() }}</p> }
            <div class="flex justify-end gap-2">
              <app-button variant="secondary" (clicked)="cancelOpen.set(false)">{{ 'users.cancel' | translate }}</app-button>
              <app-button variant="danger" [loading]="cancelling()" [disabled]="reason.value.trim().length < 5" (clicked)="cancel()">{{ 'refunds.detail.cancel' | translate }}</app-button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `,
})
export class RefundDetailComponent {
  readonly id = input.required<string>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  private readonly returns = inject(ReturnService);
  private readonly translate = inject(TranslateService);

  readonly refund = signal<Refund | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly cancelOpen = signal(false);
  readonly cancelling = signal(false);
  readonly cancelError = signal('');
  readonly reason = new FormControl('', { nonNullable: true });
  readonly busy = signal(false);
  readonly actionError = signal('');

  statusClass = counterBillStatusBadgeClass;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.returns.refund(this.id()).subscribe({
      next: (refund) => {
        this.loading.set(false);
        this.refund.set(refund);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(e, this.translate));
      },
    });
  }

  openCancel(): void {
    this.reason.setValue('');
    this.cancelError.set('');
    this.cancelOpen.set(true);
  }

  /** R68: the slip opens in a new tab for the browser's print dialog; the tab is opened first so a pop-up blocker allows it. */
  print(r: Refund): void {
    const tab = window.open('', '_blank');
    this.withPdf(r, (url) => { if (tab) tab.location.href = url; }, () => tab?.close());
  }

  /** R68: the slip is saved as a file named after the refund number. */
  download(r: Refund): void {
    this.withPdf(r, (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = r.number.split('/').join('-') + '.pdf';
      link.click();
    });
  }

  private withPdf(r: Refund, use: (objectUrl: string) => void, onError?: () => void): void {
    this.busy.set(true);
    this.actionError.set('');
    this.returns.refundSlip(r.id).subscribe({
      next: (blob) => {
        this.busy.set(false);
        const url = URL.createObjectURL(blob);
        use(url);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.actionError.set(messageForError(e, this.translate));
        onError?.();
      },
    });
  }

  cancel(): void {
    if (this.reason.value.trim().length < 5) return;
    this.cancelling.set(true);
    this.cancelError.set('');
    this.returns.cancelRefund(this.id(), this.reason.value.trim()).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelOpen.set(false);
        this.load();
        this.changed.emit();
      },
      error: (e: unknown) => {
        this.cancelling.set(false);
        this.cancelError.set(messageForError(e, this.translate));
      },
    });
  }
}
