import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminOrderService, PaymentService, MediaService } from '@org/api-services';
import { AdminOrderDetail, PaymentDetail } from '@org/shared-models';
import { LoadingSpinnerComponent, ToastService } from '@org/ui';

@Component({
  selector: 'app-admin-order-detail-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, LoadingSpinnerComponent],
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

        <!-- Order + Member Info -->
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
            <!-- Member Info -->
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                <i class="fa fa-user mr-1.5 text-saffron-500"></i>Member Info
              </h3>
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-gray-500">Name</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.member.memberName }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Reg No</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.member.registrationNumber }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Mobile</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ order()!.member.mobile }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Email</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ order()!.member.email }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Status</p>
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="order()!.member.memberStatus === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ order()!.member.memberStatus }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Sponsor Info -->
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                <i class="fa fa-user-tie mr-1.5 text-saffron-500"></i>Sponsor Info
              </h3>
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-gray-500">Name</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.sponsor.sponsorName }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Reg No</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ order()!.sponsor.registrationNumber }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Mobile</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">{{ order()!.sponsor.mobile }}</p>
                </div>
              </div>
            </div>

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

        <!-- Action Buttons -->
        @if (canApprove() || canReject()) {
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
              <i class="fa fa-cog mr-1.5 text-saffron-500"></i>Actions
            </h3>
            <div class="flex flex-wrap gap-3">
              @if (canApprove()) {
                <button (click)="approveOrder()" [disabled]="actionLoading()"
                  class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <i class="fa fa-thumbs-up mr-1.5"></i>Approve Order
                </button>
              }
              @if (canReject()) {
                <button (click)="rejectOrder()" [disabled]="actionLoading()"
                  class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  <i class="fa fa-thumbs-down mr-1.5"></i>Reject Order
                </button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AdminOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly mediaService = inject(MediaService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly order = signal<AdminOrderDetail | null>(null);
  readonly payment = signal<PaymentDetail | null>(null);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const memberId = this.route.snapshot.parent?.paramMap.get('memberId') ?? undefined;
    if (id) {
      this.loadOrder(id, memberId);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  canApprove(): boolean {
    const s = this.order()?.status;
    return s === 'PendingPayment' || s === 'PaymentReceived';
  }

  canReject(): boolean {
    const s = this.order()?.status;
    return s === 'PendingPayment' || s === 'PaymentReceived';
  }

  approveOrder(): void {
    const id = this.order()?.id;
    if (!id) return;
    this.actionLoading.set(true);
    this.adminOrderService.approveOrder(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadOrder(id);
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false),
    });
  }

  rejectOrder(): void {
    const id = this.order()?.id;
    if (!id) return;
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.actionLoading.set(true);
    this.adminOrderService.rejectOrder(id, reason).subscribe({
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

  private loadOrder(id: number, memberId?: string): void {
    this.loading.set(true);
    this.adminOrderService.getOrderDetail(id, memberId).subscribe({
      next: (order) => {
        this.order.set(order);
        if (order.paymentMode === 'Offline') {
          this.loadPayment(order.id);
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
