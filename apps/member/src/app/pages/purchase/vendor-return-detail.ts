import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { PurchaseService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { VendorReturn } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { PdfHandlers, downloadPdf, printPdf } from '../returns/pdf-delivery';

/**
 * One vendor return in the panel beside the list (purchase spec R2, R8, R11, R12): its number, date, vendor, the lines with where each
 * left from, the totals (the server's own), the remark and, right after saving, a notice for items whose stock went to zero or below
 * (R6). Print and Download PDF give the A4 Debit Note (R11); the Owner cancels with a reason, Staff only read (R9).
 */
@Component({
  selector: 'app-vendor-return-detail',
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
      } @else if (vendorReturn(); as r) {
        <section class="flex flex-col gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 font-mono text-lg font-semibold text-primary-fg" [class.line-through]="r.status === 'CANCELLED'">{{ r.number }}</h1>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(r.status)">{{ 'returns.status.' + r.status | translate }}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span class="font-mono">{{ r.returnDate }}</span>
                <span>{{ r.vendorName }} <span class="font-mono">({{ r.vendorCode }})</span></span>
              </div>
            </div>
            <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
          </div>
          @if (r.remark) { <p class="m-0 text-xs text-gray-600">{{ r.remark }}</p> }
          @if (lowStock()) {
            <p class="m-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="status">{{ 'purchase.detail.lowStock' | translate }}</p>
          }
          <div class="flex flex-wrap gap-2">
            <app-button size="sm" variant="secondary" [loading]="busy()" (clicked)="print(r)">{{ 'purchase.detail.print' | translate }}</app-button>
            <app-button size="sm" [loading]="busy()" (clicked)="download(r)">{{ 'purchase.detail.downloadPdf' | translate }}</app-button>
            @if (isOwner && r.status === 'ACTIVE') { <app-button size="sm" variant="secondary" (clicked)="openCancel()">{{ 'purchase.detail.cancel' | translate }}</app-button> }
          </div>
          @if (actionError()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ actionError() }}</p> }
          @if (r.status === 'CANCELLED' && r.cancelReason) {
            <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="status">{{ 'returns.detail.cancelled' | translate }}: {{ r.cancelReason }}@if (r.cancelledOn) { <span class="text-gray-500"> ({{ r.cancelledOn }})</span> }</p>
          }
        </section>

        <section class="overflow-x-auto rounded-[10px] border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
          <table class="w-full min-w-[520px] text-left text-xs" [class.line-through]="r.status === 'CANCELLED'">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'purchase.lines.source' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'purchase.lines.rate' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.qty' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.amount' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @for (line of r.lines; track $index) {
                <tr>
                  <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ line.itemName }}</span> <span class="ml-1 font-mono text-gray-500">{{ line.itemCode }}</span></td>
                  <td class="px-3 py-2">{{ 'purchase.source.' + line.stockSource | translate }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.rateAmount | number: '1.2-2' }}</td>
                  <td class="px-3 py-2 text-right">{{ line.quantity }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.lineAmount | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <aside class="ml-auto w-full max-w-xs rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
          <dl class="m-0 grid gap-1.5 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">{{ 'sales.totals.subtotal' | translate }}</dt><dd class="m-0 font-mono">{{ r.subtotal | number: '1.2-2' }}</dd></div>
            @if (r.roundOff !== 0) { <div class="flex justify-between"><dt class="text-gray-500">{{ 'sales.totals.roundOff' | translate }}</dt><dd class="m-0 font-mono">{{ r.roundOff | number: '1.2-2' }}</dd></div> }
            <div class="flex justify-between border-t border-neutral-200 pt-1.5 text-base font-semibold dark:border-charcoal-700"><dt>{{ 'sales.totals.grandTotal' | translate }}</dt><dd class="m-0 font-mono">{{ r.grandTotal | number: '1.2-2' }}</dd></div>
          </dl>
        </aside>

        <app-modal [open]="cancelOpen()" [title]="'purchase.detail.cancelTitle' | translate" (closed)="cancelOpen.set(false)">
          <div class="space-y-3">
            <p class="text-sm text-gray-600">{{ 'purchase.detail.cancelHint' | translate }}</p>
            <label for="vrd-reason" class="block text-sm font-semibold">{{ 'sales.editor.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <textarea id="vrd-reason" rows="3" [formControl]="reason" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea>
            @if (cancelError()) { <p class="text-xs text-red-600" role="alert">{{ cancelError() }}</p> }
            <div class="flex justify-end gap-2">
              <app-button variant="secondary" (clicked)="cancelOpen.set(false)">{{ 'users.cancel' | translate }}</app-button>
              <app-button variant="danger" [loading]="cancelling()" [disabled]="reason.value.trim().length < 5" (clicked)="cancel()">{{ 'purchase.detail.cancel' | translate }}</app-button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `,
})
export class VendorReturnDetailComponent {
  readonly id = input.required<string>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  private readonly purchase = inject(PurchaseService);
  private readonly translate = inject(TranslateService);

  /** R9: only the Owner cancels a vendor return. */
  readonly isOwner = inject(AuthService).hasAppRole('OWNER');

  readonly vendorReturn = signal<VendorReturn | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly lowStock = signal(false);
  readonly cancelOpen = signal(false);
  readonly cancelling = signal(false);
  readonly cancelError = signal('');
  readonly reason = new FormControl('', { nonNullable: true });
  readonly busy = signal(false);
  readonly actionError = signal('');

  statusClass = counterBillStatusBadgeClass;

  private readonly pdfHandlers: PdfHandlers = { busy: (v) => this.busy.set(v), failed: (e) => this.actionError.set(messageForError(e, this.translate)) };

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.purchase.vendorReturn(this.id()).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.vendorReturn.set(r);
        this.lowStock.set(history.state?.lowStockId === r.id);
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

  /** R11: the Debit Note opens in a new tab for the browser's print dialog. */
  print(r: VendorReturn): void {
    this.actionError.set('');
    printPdf(this.purchase.debitNotePdf(r.id), this.pdfHandlers);
  }

  /** R11: the Debit Note is saved as a file named after its number. */
  download(r: VendorReturn): void {
    this.actionError.set('');
    downloadPdf(this.purchase.debitNotePdf(r.id), r.number, this.pdfHandlers);
  }

  cancel(): void {
    if (this.reason.value.trim().length < 5) return;
    this.cancelling.set(true);
    this.cancelError.set('');
    this.purchase.cancelVendorReturn(this.id(), this.reason.value.trim()).subscribe({
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
