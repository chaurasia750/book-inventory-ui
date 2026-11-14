import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, PaymentService, MediaService } from '@org/api-services';
import { OrderDetail, PaymentDetail } from '@org/shared-models';
import { LoadingSpinnerComponent, ToastService, DisableOnRequestDirective } from '@org/ui';

@Component({
  selector: 'app-member-order-detail-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, LoadingSpinnerComponent, DisableOnRequestDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (order()) {
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Order Detail</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ order()!.orderNo }}</p>
          </div>
          <button (click)="goBack()" class="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <i class="fa fa-arrow-left mr-1.5"></i>Back
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Order Info -->
          <div class="lg:col-span-2 space-y-6">
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                <i class="fa fa-receipt mr-1.5 text-saffron-500"></i>Order Information
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p class="text-xs text-gray-500">Order No</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.orderNo }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Type</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.orderType }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Amount</p>
                  <p class="text-sm font-semibold text-saffron-500">{{ order()!.totalAmount | currency:'INR' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Payment Mode</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.paymentMode }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Status</p>
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="getStatusClass(order()!.status)">
                    {{ order()!.status }}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Created</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.createdDate | date:'dd MMM yyyy, h:mm a' }}</p>
                </div>
                @if (order()!.approvedOn) {
                  <div>
                    <p class="text-xs text-gray-500">Approved On</p>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.approvedOn | date:'dd MMM yyyy, h:mm a' }}</p>
                  </div>
                }
                @if (order()!.rejectedReason) {
                  <div class="col-span-2 sm:col-span-3">
                    <p class="text-xs text-gray-500">Rejection Reason</p>
                    <p class="text-sm font-semibold text-red-600">{{ order()!.rejectedReason }}</p>
                  </div>
                }
                @if (order()!.remarks) {
                  <div class="col-span-2 sm:col-span-3">
                    <p class="text-xs text-gray-500">Remarks</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">{{ order()!.remarks }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Order Items -->
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                <i class="fa fa-box mr-1.5 text-saffron-500"></i>Order Items
              </h3>
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead class="border-y border-gray-100 dark:border-white/5">
                    <tr>
                      <th class="px-4 py-2 text-start text-xs font-medium text-gray-500">Item</th>
                      <th class="px-4 py-2 text-start text-xs font-medium text-gray-500">Qty</th>
                      <th class="px-4 py-2 text-start text-xs font-medium text-gray-500">Unit Price</th>
                      <th class="px-4 py-2 text-start text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-white/5">
                    @for (item of order()!.items; track item.id) {
                      <tr>
                        <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ item.itemName }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ item.quantity }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ item.unitPrice | currency:'INR' }}</td>
                        <td class="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">{{ item.amount | currency:'INR' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Payment Info -->
            @if (payment()) {
              <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                  <i class="fa fa-credit-card mr-1.5 text-saffron-500"></i>Payment Info
                </h3>
                <div class="space-y-3">
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
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="getPaymentStatusClass(payment()!.status)">
                      {{ payment()!.status }}
                    </span>
                  </div>
                  @if (payment()!.paidOn) {
                    <div>
                      <p class="text-xs text-gray-500">Paid On</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">{{ payment()!.paidOn | date:'dd MMM yyyy, h:mm a' }}</p>
                    </div>
                  }
                  @if (payment()!.remarks) {
                    <div>
                      <p class="text-xs text-gray-500">Remarks</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">{{ payment()!.remarks }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Payment Screenshot -->
            @if (payment()?.mediaFileId) {
              <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                  <i class="fa fa-image mr-1.5 text-saffron-500"></i>Payment Screenshot
                </h3>
                <a [href]="getScreenshotUrl(payment()!.mediaFileId!)" target="_blank" class="block">
                  <img [src]="getScreenshotUrl(payment()!.mediaFileId!)" alt="Payment Screenshot"
                    class="w-full rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow" />
                </a>
              </div>
            }
          </div>
        </div>

        <!-- Status History -->
        @if (order()!.statusHistory.length > 0) {
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
              <i class="fa fa-clock mr-1.5 text-saffron-500"></i>Status History
            </h3>
            <div class="space-y-3">
              @for (h of order()!.statusHistory; track h.changedOn) {
                <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="w-2 h-2 rounded-full bg-saffron-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p class="text-sm text-gray-800 dark:text-white/90">
                      <span class="font-semibold">{{ h.fromStatus || 'New' }}</span>
                      <i class="fa fa-arrow-right mx-1 text-xs text-gray-400"></i>
                      <span class="font-semibold">{{ h.toStatus }}</span>
                    </p>
                    @if (h.remarks) {
                      <p class="text-xs text-gray-500 mt-0.5">{{ h.remarks }}</p>
                    }
                    <p class="text-xs text-gray-400 mt-0.5">{{ h.changedOn | date:'dd MMM yyyy, h:mm a' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Cancel Button -->
        @if (canCancel()) {
          <div class="flex justify-end">
            <button (click)="cancelOrder()" appDisableOnRequest [disabled]="actionLoading()"
              class="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm">
              <i class="fa fa-times-circle mr-1.5"></i>Cancel Order
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class MemberOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly mediaService = inject(MediaService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly order = signal<OrderDetail | null>(null);
  readonly payment = signal<PaymentDetail | null>(null);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadOrder(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/course/list']);
  }

  canCancel(): boolean {
    const s = this.order()?.status;
    return s === 'Draft' || s === 'PendingPayment';
  }

  cancelOrder(): void {
    const id = this.order()?.id;
    if (!id || !confirm('Are you sure you want to cancel this order?')) return;
    this.actionLoading.set(true);
    this.orderService.cancelOrder(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadOrder(id);
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

  private loadOrder(id: number): void {
    this.loading.set(true);
    this.orderService.getOrderDetail(id).subscribe({
      next: (order) => {
        this.order.set(order);
        if (order.paymentMode === 'Offline') {
          this.loadPayment(id);
        } else {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
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
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
