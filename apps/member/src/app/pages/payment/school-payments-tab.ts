import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ReceiptSummary } from '@org/shared-models';
import { ButtonComponent, PaginationComponent, SkeletonLoaderComponent } from '@org/ui';
import { ReceiptDetailDialogComponent } from './receipt-detail-dialog';
import { ReceivePaymentDialogComponent } from './receive-payment-dialog';

const PAGE_SIZE = 10;

/**
 * The Payments tab of a school's profile (payment spec R16, platform U14): the school's receipts newest first, paged, with the
 * Receive payment button (R3-R9). A row opens the receipt. For the Owner only (payment R2); the tab is not offered to Staff.
 */
@Component({
  selector: 'app-school-payments-tab',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslatePipe, ButtonComponent, PaginationComponent, SkeletonLoaderComponent, ReceivePaymentDialogComponent, ReceiptDetailDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <label class="flex items-center gap-2 text-xs">
          <input type="checkbox" class="h-4 w-4" [checked]="pendingOnly()" (change)="setPendingOnly($any($event.target).checked)" />
          {{ 'payment.tab.pendingOnly' | translate }}
        </label>
        <app-button size="sm" (clicked)="receiveOpen.set(true)">{{ 'payment.tab.receive' | translate }}</app-button>
      </div>
      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      }
      <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
        <table class="w-full text-left text-xs">
          <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
            <tr>
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.number' | translate }}</th>
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.date' | translate }}</th>
              <th class="px-3 py-2 font-semibold">{{ 'sales.columns.status' | translate }}</th>
              <th class="px-3 py-2 text-right font-semibold">{{ 'payment.detail.total' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
            @if (loading()) {
              <tr><td colspan="4" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr>
            } @else {
              @for (r of rows(); track r.id) {
                <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700" tabindex="0" (click)="openId.set(r.id)" (keydown.enter)="openId.set(r.id)">
                  <td class="whitespace-nowrap px-3 py-2 font-mono font-medium text-primary-fg" [class.line-through]="r.status === 'CANCELLED'">{{ r.number }}</td>
                  <td class="whitespace-nowrap px-3 py-2 text-gray-600">{{ r.receiptDate | date: 'dd MMM yy' }}</td>
                  <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="r.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">{{ 'payment.status.' + r.status | translate }}</span></td>
                  <td class="whitespace-nowrap px-3 py-2 text-right font-mono">{{ r.totalAmount | number: '1.2-2' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="py-6 text-center text-sm text-gray-400">{{ 'payment.tab.empty' | translate }}</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [pageSize]="pageSize" [total]="total()" (pageChange)="goTo($event)" />
    </div>
    <app-receive-payment-dialog [open]="receiveOpen()" [schoolId]="schoolId()" (closed)="receiveOpen.set(false)" (recordedReceipt)="load()" />
    <app-receipt-detail-dialog [receiptId]="openId()" (closed)="openId.set(null)" (changed)="load()" />
  `,
})
export class SchoolPaymentsTabComponent {
  readonly schoolId = input.required<string>();

  private readonly payments = inject(PaymentService);
  private readonly translate = inject(TranslateService);

  readonly pageSize = PAGE_SIZE;
  readonly rows = signal<ReceiptSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly receiveOpen = signal(false);
  readonly openId = signal<string | null>(null);
  /** Payment R16: only the receipts that have a pending cheque. */
  readonly pendingOnly = signal(false);

  constructor() {
    effect(() => {
      this.schoolId();
      untracked(() => {
        this.page.set(1);
        this.load();
      });
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.payments.list({ schoolId: this.schoolId(), chequeStatus: this.pendingOnly() ? 'PENDING' : undefined, pageIndex: this.page(), pageSize: PAGE_SIZE }).subscribe({
      next: (p) => {
        this.rows.set(p.items);
        this.total.set(p.totalCount);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  setPendingOnly(on: boolean): void {
    this.pendingOnly.set(on);
    this.page.set(1);
    this.load();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }
}
