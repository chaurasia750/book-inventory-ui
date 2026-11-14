import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminOrderService, MemberProfileService } from '@org/api-services';
import { AdminOrderListItem } from '@org/shared-models';

@Component({
  selector: 'app-member-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <i class="fa fa-spinner fa-spin text-2xl text-saffron-500 mb-2"></i>
          <p class="text-gray-500 text-xs">Loading orders...</p>
        </div>
      </div>
    } @else if (error()) {
      <div class="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <i class="fa fa-exclamation-circle"></i>
        <span>{{ error() }}</span>
      </div>
    } @else if (orders().length === 0) {
      <div class="rounded-2xl border border-gray-100 bg-white p-10 shadow-sm">
        <div class="flex flex-col items-center justify-center">
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg class="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
            </svg>
          </div>
          <p class="mb-1 text-sm font-medium text-gray-900">No Orders Found</p>
          <p class="text-xs text-gray-500">This member has no orders yet.</p>
        </div>
      </div>
    } @else {
      <div class="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div class="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Order History</h3>
          <span class="text-xs text-gray-400">{{ totalCount() }} order(s)</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/80">
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Payment</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-gray-50/60 transition-colors">
                  <td class="px-4 py-3 text-sm font-mono text-[#66B42A] font-medium">{{ order.orderNo }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ order.orderType }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ (order.createdDate | date:'dd MMM yyyy') || 'â€”' }}</td>
                  <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{{ order.totalAmount | currency:'INR' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="getPaymentStatusClass(order.paymentStatus)">
                      {{ order.paymentMode }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      [class]="getStatusClass(order.orderStatus)">
                      <span class="h-1.5 w-1.5 rounded-full" [class]="getStatusDot(order.orderStatus)"></span>
                      {{ order.orderStatus }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
            <p class="text-xs text-gray-400">Page {{ currentPage() }} of {{ totalPages() }}</p>
            <div class="flex gap-2">
              <button (click)="prevPage()" [disabled]="currentPage() <= 1"
                class="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Prev
              </button>
              <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()"
                class="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class MemberOrdersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly profileApi = inject(MemberProfileService);
  private readonly adminOrderApi = inject(AdminOrderService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly orders = signal<AdminOrderListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  private readonly pageSize = 20;

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set('');

    const memberId = this.route.snapshot.paramMap.get('memberId');

    if (!memberId) {
      this.orders.set([]);
      this.loading.set(false);
      this.cdr.markForCheck();
      return;
    }

    this.profileApi.getProfileByMemberId(memberId).subscribe({
      next: (profile) => {
        const loginId = profile.loginId;
        if (!loginId) {
          this.orders.set([]);
          this.loading.set(false);
          this.cdr.markForCheck();
          return;
        }

        this.adminOrderApi.getOrders({
          loginId,
          page: this.currentPage(),
          pageSize: this.pageSize,
          sortBy: 'CreatedDate',
          sortDirection: 'Desc',
        }).subscribe({
          next: (res) => {
            this.orders.set(res.orders ?? []);
            this.totalCount.set(res.totalRecords ?? 0);
            this.totalPages.set(res.totalPages ?? 0);
            this.loading.set(false);
            this.cdr.markForCheck();
          },
          error: () => {
            this.error.set('Failed to load orders.');
            this.loading.set(false);
            this.cdr.markForCheck();
          },
        });
      },
      error: () => {
        this.error.set('Failed to load member profile.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadOrders();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadOrders();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'PendingPayment':
      case 'PaymentReceived':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500 border border-gray-200';
      default:
        return 'bg-saffron-50 text-saffron-700 border border-saffron-200';
    }
  }

  getStatusDot(status: string): string {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-green-500';
      case 'PendingPayment':
      case 'PaymentReceived':
        return 'bg-yellow-500';
      case 'Rejected':
        return 'bg-red-500';
      case 'Cancelled':
        return 'bg-gray-400';
      default:
        return 'bg-saffron-500';
    }
  }

  getPaymentStatusClass(status: string | null): string {
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
        return 'bg-gray-50 text-gray-500';
    }
  }
}
