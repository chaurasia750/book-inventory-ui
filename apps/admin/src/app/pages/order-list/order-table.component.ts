import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AdminOrderListItem } from '@org/shared-models';
import { PaginationComponent } from '@org/ui';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-table.component.html',
})
export class OrderTableComponent {
  items = input.required<AdminOrderListItem[]>();
  currentPage = input.required<number>();
  pageSize = input.required<number>();
  totalCount = input.required<number>();

  viewOrder = output<number>();
  pageChange = output<number>();

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700';
      case 'PendingPayment':
      case 'PaymentReceived':
        return 'bg-amber-50 text-amber-700';
      case 'Rejected':
        return 'bg-red-50 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-saffron-50 text-saffron-700';
    }
  }

  getPaymentStatusClass(status: string | null): string {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700';
      case 'Pending':
        return 'bg-amber-50 text-amber-700';
      case 'Failed':
      case 'Rejected':
        return 'bg-red-50 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      case 'Refunded':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }

  getMemberStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700';
      case 'inactive':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }
}
