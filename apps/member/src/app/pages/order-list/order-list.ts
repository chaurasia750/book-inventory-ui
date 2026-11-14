import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService, PaymentService, MediaService } from '@org/api-services';
import { OrderDetail, OrderListItem, PaymentDetail } from '@org/shared-models';
import { LoadingSpinnerComponent, PaginationComponent, SidePanelComponent, ToastService } from '@org/ui';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, LoadingSpinnerComponent, PaginationComponent, SidePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Order List</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">View your order history</p>
        </div>
        <a [routerLink]="newOrderRoute"
          class="inline-flex items-center gap-2 rounded-xl bg-[#66B42A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4E9C1F] hover:shadow-md">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          New Order
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="border-y border-gray-100 dark:border-white/5">
                <tr>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">S.N.</th>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">Order No</th>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">Items</th>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th class="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th class="px-4 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-white/5">
                @for (item of pagedItems(); track item.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-400">{{ (currentPage() - 1) * pageSize + $index + 1 }}</td>
                    <td class="px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.orderNo }}</td>
                    <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-400">{{ item.orderType }}</td>
                    <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-400">{{ item.itemCount }}</td>
                    <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-400">{{ item.totalAmount | currency:'INR' }}</td>
                    <td class="px-4 py-4">
                      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        [class]="getStatusClass(item.status)">
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-400">{{ item.createdDate | date:'dd MMM yyyy' }}</td>
                    <td class="px-4 py-4 text-end">
                      <button (click)="openDetail(item.id)"
                        class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-saffron-600 bg-saffron-50 rounded-lg hover:bg-saffron-100 transition-colors">
                        <i class="fa fa-eye mr-1"></i>View
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-4 py-16 text-center">
                      <div class="flex flex-col items-center">
                        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                          <svg class="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
                          </svg>
                        </div>
                        <p class="mb-1 text-sm font-medium text-gray-900 dark:text-white/90">No Orders Yet</p>
                        <p class="mb-4 text-xs text-gray-500">Place your first order to get started.</p>
                        <a [routerLink]="newOrderRoute"
                          class="inline-flex items-center gap-2 rounded-xl bg-[#66B42A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4E9C1F] hover:shadow-md">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                          </svg>
                          Create Your First Order
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages() > 1) {
            <div class="border-t border-gray-100 dark:border-white/5 px-6 py-4">
              <app-pagination
                [page]="currentPage()"
                [pageSize]="pageSize"
                [total]="totalCount()"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        </div>
      }
    </div>

    <!-- Order Detail Side Panel -->
    <app-side-panel [isOpen]="panelOpen()" [title]="'Order ' + (detail()?.orderNo ?? '')" panelWidth="520px"
      (closed)="closePanel()">
      @if (panelLoading()) {
        <app-loading-spinner />
      } @else if (detail()) {
        <div class="space-y-5">
          <!-- Order Info -->
          <div>
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Information</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-gray-500">Type</p>
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ detail()!.orderType }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Amount</p>
                <p class="text-sm font-semibold text-saffron-500">{{ detail()!.totalAmount | currency:'INR' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Payment Mode</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ detail()!.paymentMode }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Status</p>
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  [class]="getStatusClass(detail()!.status)">
                  {{ detail()!.status }}
                </span>
              </div>
              <div>
                <p class="text-xs text-gray-500">Created</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ detail()!.createdDate | date:'dd MMM yyyy, h:mm a' }}</p>
              </div>
              @if (detail()!.approvedOn) {
                <div>
                  <p class="text-xs text-gray-500">Approved On</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ detail()!.approvedOn | date:'dd MMM yyyy, h:mm a' }}</p>
                </div>
              }
              @if (detail()!.rejectedReason) {
                <div class="col-span-2">
                  <p class="text-xs text-gray-500">Rejection Reason</p>
                  <p class="text-sm font-semibold text-red-600">{{ detail()!.rejectedReason }}</p>
                </div>
              }
              @if (detail()!.remarks) {
                <div class="col-span-2">
                  <p class="text-xs text-gray-500">Remarks</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ detail()!.remarks }}</p>
                </div>
              }
            </div>
          </div>

          <hr class="border-gray-100 dark:border-white/5" />

          <!-- Order Items -->
          <div>
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</h4>
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 dark:border-white/5">
                  <th class="pb-1 text-start text-xs font-medium text-gray-500">Item</th>
                  <th class="pb-1 text-start text-xs font-medium text-gray-500">Qty</th>
                  <th class="pb-1 text-end text-xs font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/[0.03]">
                @for (item of detail()!.items; track item.id) {
                  <tr>
                    <td class="py-2 text-gray-700 dark:text-gray-300">{{ item.itemName }}</td>
                    <td class="py-2 text-gray-700 dark:text-gray-300">{{ item.quantity }}</td>
                    <td class="py-2 text-end font-medium text-gray-800 dark:text-white/90">{{ item.amount | currency:'INR' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Payment -->
          @if (payment()) {
            <hr class="border-gray-100 dark:border-white/5" />
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-gray-500">Payment No</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ payment()!.paymentNo }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Method</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ payment()!.paymentMethod }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Amount</p>
                  <p class="text-sm font-semibold text-saffron-500">{{ payment()!.amount | currency:'INR' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Reference</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ payment()!.transactionReference }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Status</p>
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    [class]="getPaymentStatusClass(payment()!.status)">
                    {{ payment()!.status }}
                  </span>
                </div>
                @if (payment()!.paidOn) {
                  <div>
                    <p class="text-xs text-gray-500">Paid On</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">{{ payment()!.paidOn | date:'dd MMM yyyy, h:mm a' }}</p>
                  </div>
                }
              </div>
              @if (payment()?.mediaFileId) {
                <div class="mt-3">
                  <p class="text-xs text-gray-500 mb-1">Screenshot</p>
                  <a [href]="getScreenshotUrl(payment()!.mediaFileId!)" target="_blank">
                    <img [src]="getScreenshotUrl(payment()!.mediaFileId!)" alt="Payment Screenshot"
                      class="w-32 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow" />
                  </a>
                </div>
              }
            </div>
          }

          <!-- Status History -->
          @if (detail()!.statusHistory.length > 0) {
            <hr class="border-gray-100 dark:border-white/5" />
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status History</h4>
              <div class="space-y-2">
                @for (h of detail()!.statusHistory; track h.changedOn) {
                  <div class="flex items-start gap-2 text-sm">
                    <div class="w-1.5 h-1.5 rounded-full bg-saffron-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p class="text-gray-800 dark:text-white/90">
                        <span class="font-semibold">{{ h.fromStatus || 'New' }}</span>
                        <i class="fa fa-arrow-right mx-1 text-xs text-gray-400"></i>
                        <span class="font-semibold">{{ h.toStatus }}</span>
                      </p>
                      @if (h.remarks) {
                        <p class="text-xs text-gray-500">{{ h.remarks }}</p>
                      }
                      <p class="text-xs text-gray-400">{{ h.changedOn | date:'dd MMM yyyy, h:mm a' }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Cancel Button -->
          @if (canCancel()) {
            <hr class="border-gray-100 dark:border-white/5" />
            <div class="flex justify-end">
              <button (click)="cancelOrder()" [disabled]="actionLoading()"
                class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                <i class="fa fa-times-circle mr-1.5"></i>Cancel Order
              </button>
            </div>
          }
        </div>
      }
    </app-side-panel>
  `,
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly mediaService = inject(MediaService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Route the header "New Order" button navigates to (relative to the app root, no `/member` prefix). */
  @Input() newOrderRoute = '/course/new';

  readonly allItems = signal<OrderListItem[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly pagedItems = signal<OrderListItem[]>([]);

  readonly panelOpen = signal(false);
  readonly panelLoading = signal(false);
  readonly detail = signal<OrderDetail | null>(null);
  readonly payment = signal<PaymentDetail | null>(null);
  readonly actionLoading = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
  }

  openDetail(id: number): void {
    this.panelOpen.set(true);
    this.panelLoading.set(true);
    this.detail.set(null);
    this.payment.set(null);
    this.cdr.markForCheck();

    this.orderService.getOrderDetail(id).subscribe({
      next: (order) => {
        this.detail.set(order);
        if (order.paymentMode === 'Offline') {
          this.loadPayment(id);
        } else {
          this.panelLoading.set(false);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.panelLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.detail.set(null);
    this.payment.set(null);
  }

  canCancel(): boolean {
    const s = this.detail()?.status;
    return s === 'Draft' || s === 'PendingPayment';
  }

  cancelOrder(): void {
    const id = this.detail()?.id;
    if (!id || !confirm('Are you sure you want to cancel this order?')) return;
    this.actionLoading.set(true);
    this.orderService.cancelOrder(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.openDetail(id);
        this.loadOrders();
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false),
    });
  }

  getScreenshotUrl(mediaFileId: number): string {
    return this.mediaService.getFileUrl(mediaFileId);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-green-50 text-green-700';
      case 'PendingPayment':
      case 'PaymentReceived':
        return 'bg-yellow-50 text-yellow-700';
      case 'Rejected':
        return 'bg-red-50 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-saffron-50 text-saffron-700';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'Verified':
        return 'bg-green-50 text-green-700';
      case 'Pending':
        return 'bg-yellow-50 text-yellow-700';
      case 'Rejected':
      case 'Failed':
        return 'bg-red-50 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-saffron-50 text-saffron-700';
    }
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.orderService
      .getMyOrders({ page: this.currentPage(), pageSize: this.pageSize })
      .subscribe({
        next: (res) => {
          this.allItems.set(res.items ?? []);
          this.totalCount.set(res.totalCount ?? 0);
          this.totalPages.set(Math.ceil((res.totalCount ?? 0) / this.pageSize));
          this.pagedItems.set(res.items ?? []);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private loadPayment(orderId: number): void {
    this.paymentService.getPaymentByReference(1, orderId).subscribe({
      next: (p) => {
        this.payment.set(p);
        this.panelLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.panelLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
