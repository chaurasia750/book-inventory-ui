import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CounterBill, SaleTotals } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent } from '@org/ui';
import { SaleTotalsComponent } from '../sales/sale-totals';

/**
 * One counter bill in the panel beside the bills list (sales spec R47, R49, R51): its number, date, counter, school, the student with
 * the class and the optional values, the lines, the totals (the server's own), the Cash and UPI payments and the remark. The Owner
 * cancels it with a reason; Staff only read (R48). A cancelled bill keeps its number and is struck through. The "This student's
 * bills" button lists the student's bills together (R49). Print and Download PDF give the A5 receipt (R51).
 */
@Component({
  selector: 'app-counter-bill-detail',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, CloseButtonComponent, ModalComponent, SkeletonLoaderComponent, SaleTotalsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      @if (loading()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="space-y-3 rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
          <app-skeleton-loader width="14rem" /><app-skeleton-loader width="100%" /><app-skeleton-loader width="80%" />
        </div>
      } @else if (loadError()) {
        <div class="flex justify-end"><app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" /></div>
        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ loadError() }}</span>
          <app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      } @else if (bill(); as b) {
        <section class="flex flex-col gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-charcoal-700 dark:bg-charcoal-800">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 font-mono text-lg font-semibold text-primary-fg" [class.line-through]="b.status === 'CANCELLED'">{{ b.number }}</h1>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(b.status)">{{ 'counter.billStatus.' + b.status | translate }}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span class="font-mono">{{ b.billDate }}</span>
                <span>{{ b.counterName || '-' }}</span>
                <span>{{ b.schoolName }}@if (b.schoolCode) { <span class="font-mono"> ({{ b.schoolCode }})</span> }</span>
                <span>{{ 'counter.fields.session' | translate }}: <span class="font-mono">{{ b.session }}</span></span>
              </div>
            </div>
            <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
          </div>

          <div class="rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-sm dark:border-charcoal-700 dark:bg-charcoal-900/40">
            <p class="m-0 font-medium text-primary-fg">{{ b.student.name }}</p>
            <p class="m-0 text-xs text-gray-500">
              {{ b.student.className }}@if (b.student.section) { · {{ b.student.section }} }@if (b.student.rollNumber) { · {{ 'counter.student.roll' | translate }} {{ b.student.rollNumber }} }@if (b.student.parentMobile) { · {{ b.student.parentMobile }} }
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <app-button size="sm" variant="secondary" (clicked)="studentBills.emit(b.student.id)">{{ 'counter.bill.studentBills' | translate }}</app-button>
            <app-button size="sm" variant="secondary" [loading]="busy()" (clicked)="print(b)">{{ 'counter.bill.print' | translate }}</app-button>
            <app-button size="sm" [loading]="busy()" (clicked)="download(b)">{{ 'counter.bill.downloadPdf' | translate }}</app-button>
            @if (isOwner && b.status === 'ACTIVE') {
              <app-button size="sm" variant="secondary" (clicked)="openCancel()">{{ 'counter.bill.cancel' | translate }}</app-button>
            }
          </div>
          @if (actionError()) {
            <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ actionError() }}</p>
          }
          @if (b.status === 'CANCELLED' && b.cancelReason) {
            <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="status">
              {{ 'counter.bill.cancelled' | translate }}: {{ b.cancelReason }}@if (b.cancelledOn) { <span class="text-gray-500"> ({{ b.cancelledOn }})</span> }
            </p>
          }
        </section>

        <section class="overflow-x-auto rounded-[10px] border border-neutral-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
          <table class="w-full min-w-[520px] text-left text-xs" [class.line-through]="b.status === 'CANCELLED'">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">MRP</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.qty' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.discount' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.amount' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @for (line of b.lines; track line.itemId + line.priceVersionName) {
                <tr>
                  <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ line.itemName }}</span> <span class="ml-1 font-mono text-gray-500">{{ line.itemCode }}</span></td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.mrpAmount | number: '1.2-2' }}</td>
                  <td class="px-3 py-2 text-right">{{ line.quantity }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.itemDiscountAmount | number: '1.2-2' }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ line.lineAmount | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <div class="grid gap-3 sm:grid-cols-2">
          <aside class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <app-sale-totals [totals]="totals()" [gstMode]="gstMode()" />
          </aside>
          <section class="rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'counter.billing.payments' | translate }}</h2>
            <dl class="grid gap-1.5 text-sm">
              @for (payment of b.payments; track payment.mode) {
                <div class="flex justify-between">
                  <dt class="text-gray-500">{{ 'counter.billing.' + (payment.mode === 'CASH' ? 'cash' : 'upi') | translate }}@if (payment.reference) { <span class="text-xs"> · {{ payment.reference }}</span> }</dt>
                  <dd class="font-mono">{{ payment.amount | number: '1.2-2' }}</dd>
                </div>
              }
            </dl>
            @if (b.remark) {
              <p class="m-0 mt-3 border-t border-neutral-200 pt-2 text-xs text-gray-600 dark:border-charcoal-700">{{ 'counter.billing.remark' | translate }}: {{ b.remark }}</p>
            }
          </section>
        </div>

        <app-modal [open]="cancelOpen()" [title]="'counter.bill.cancelTitle' | translate" (closed)="cancelOpen.set(false)">
          <div class="space-y-3">
            <p class="text-sm text-gray-600">{{ 'counter.bill.cancelHint' | translate }}</p>
            <label for="cbd-reason" class="block text-sm font-semibold">{{ 'sales.editor.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
            <textarea id="cbd-reason" rows="3" [formControl]="reason" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea>
            @if (cancelError()) { <p class="text-xs text-red-600" role="alert">{{ cancelError() }}</p> }
            <div class="flex justify-end gap-2">
              <app-button variant="secondary" (clicked)="cancelOpen.set(false)">{{ 'users.cancel' | translate }}</app-button>
              <app-button variant="danger" [loading]="cancelling()" [disabled]="reason.value.trim().length < 5" (clicked)="cancel()">{{ 'counter.bill.cancel' | translate }}</app-button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `,
})
export class CounterBillDetailComponent {
  readonly id = input.required<string>();
  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly studentBills = output<string>();

  private readonly counters = inject(CounterService);
  private readonly translate = inject(TranslateService);

  /** R48: only the Owner cancels a bill. */
  readonly isOwner = inject(AuthService).hasAppRole('OWNER');

  readonly bill = signal<CounterBill | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly cancelOpen = signal(false);
  readonly cancelling = signal(false);
  readonly cancelError = signal('');
  readonly reason = new FormControl('', { nonNullable: true });

  /** R51: a PDF is being made (Print and Download share the button spinner). */
  readonly busy = signal(false);
  readonly actionError = signal('');

  readonly totals = computed<SaleTotals | null>(() => {
    const b = this.bill();
    if (!b) return null;
    return {
      subtotal: b.subtotal,
      totalDiscount: b.totalDiscountAmount,
      taxable: b.taxable,
      cgst: b.cgst,
      sgst: b.sgst,
      igst: b.igst,
      roundOff: b.roundOff,
      grandTotal: b.grandTotal,
      gst: b.cgst + b.sgst + b.igst,
      beforeRounding: b.taxable + b.cgst + b.sgst + b.igst,
    };
  });

  /** R51: the GST split the receipt shows, read from the bill's own amounts (no company/school state is on a saved bill). */
  readonly gstMode = computed(() => {
    const b = this.bill();
    if (!b || !b.isGstApplied) return 'NOT_APPLIED' as const;
    return b.igst > 0 ? ('OTHER_STATE' as const) : ('SAME_STATE' as const);
  });

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
    this.counters.bill(this.id()).subscribe({
      next: (bill) => {
        this.loading.set(false);
        this.bill.set(bill);
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

  /** R51: the receipt opens in a new tab for the browser's print dialog; the tab is opened first so a pop-up blocker allows it. */
  print(b: CounterBill): void {
    const tab = window.open('', '_blank');
    this.withPdf(b, (url) => { if (tab) tab.location.href = url; }, () => tab?.close());
  }

  /** R51: the receipt is saved as a file named after the bill number. */
  download(b: CounterBill): void {
    this.withPdf(b, (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = b.number.split('/').join('-') + '.pdf';
      link.click();
    });
  }

  private withPdf(b: CounterBill, use: (objectUrl: string) => void, onError?: () => void): void {
    this.busy.set(true);
    this.actionError.set('');
    this.counters.billPdf(b.id).subscribe({
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
    this.counters.cancelBill(this.id(), this.reason.value.trim()).subscribe({
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
