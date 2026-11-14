import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { AdminOrderService, PaymentService, MediaService } from '@org/api-services';
import { AdminOrderDetail, AdminOrderListItem, AdminOrderSummary, PaymentDetail } from '@org/shared-models';
import { LoadingSpinnerComponent, SidePanelComponent, ToastService, BreadcrumbComponent, BreadcrumbItem } from '@org/ui';
import { OrderDashboardComponent } from './order-dashboard.component';
import { OrderFilters, OrderFiltersComponent } from './order-filters.component';
import { OrderTableComponent } from './order-table.component';

@Component({
  selector: 'app-admin-order-list-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    LoadingSpinnerComponent,
    SidePanelComponent,
    BreadcrumbComponent,
    OrderDashboardComponent,
    OrderFiltersComponent,
    OrderTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-list.html',
})
export class AdminOrderListComponent implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly mediaService = inject(MediaService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly items = signal<AdminOrderListItem[]>([]);
  readonly summary = signal<AdminOrderSummary | null>(null);
  readonly loading = signal(true);
  readonly summaryLoading = signal(true);
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly breadcrumbItems: BreadcrumbItem[] = [{ label: 'Dashboard', link: '/dashboard' }, { label: 'All Orders' }];

  readonly panelOpen = signal(false);
  readonly panelLoading = signal(false);
  readonly detail = signal<AdminOrderDetail | null>(null);
  readonly payment = signal<PaymentDetail | null>(null);
  readonly actionLoading = signal(false);

  private currentFilters: OrderFilters = {
    search: '',
    orderType: '',
    orderStatus: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
    loginId: '',
    sortBy: 'CreatedDate',
    sortDirection: 'Desc',
  };

  ngOnInit(): void {
    this.loadSummary();
    this.loadOrders();
  }

  onFilterChange(filters: OrderFilters): void {
    this.currentFilters = filters;
  }

  onSearchClick(filters: OrderFilters): void {
    this.currentFilters = filters;
    this.currentPage.set(1);
    this.loadSummary();
    this.loadOrders();
  }

  onClearFilters(): void {
    this.currentFilters = {
      search: '',
      orderType: '',
      orderStatus: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
      loginId: '',
      sortBy: 'CreatedDate',
      sortDirection: 'Desc',
    };
    this.currentPage.set(1);
    this.loadSummary();
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

    this.adminOrderService.getOrderDetail(id).subscribe({
      next: (order) => {
        this.detail.set(order);
        if (order.paymentMode === 'Offline') {
          this.loadPayment(order.id);
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

  canApprove(): boolean {
    const s = this.detail()?.status;
    return s === 'PendingPayment' || s === 'PaymentReceived';
  }

  canReject(): boolean {
    const s = this.detail()?.status;
    return s === 'PendingPayment' || s === 'PaymentReceived';
  }

  approveOrder(): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.actionLoading.set(true);
    this.adminOrderService.approveOrder(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.openDetail(id);
        this.loadOrders();
        this.loadSummary();
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false),
    });
  }

  rejectOrder(): void {
    const id = this.detail()?.id;
    if (!id) return;
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.actionLoading.set(true);
    this.adminOrderService.rejectOrder(id, reason).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.openDetail(id);
        this.loadOrders();
        this.loadSummary();
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

  private getFilterParams(): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    if (this.currentFilters.search) params['search'] = this.currentFilters.search;
    if (this.currentFilters.orderType) params['orderType'] = this.currentFilters.orderType;
    if (this.currentFilters.orderStatus) params['orderStatus'] = this.currentFilters.orderStatus;
    if (this.currentFilters.paymentStatus) params['paymentStatus'] = this.currentFilters.paymentStatus;
    if (this.currentFilters.dateFrom) params['dateFrom'] = this.currentFilters.dateFrom;
    if (this.currentFilters.dateTo) params['dateTo'] = this.currentFilters.dateTo;
    if (this.currentFilters.loginId) params['loginId'] = this.currentFilters.loginId;
    return params;
  }

  private loadSummary(): void {
    this.summaryLoading.set(true);
    this.adminOrderService.getSummary(this.getFilterParams()).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.summaryLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.summaryLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private loadOrders(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = {
      ...this.getFilterParams(),
      page: this.currentPage(),
      pageSize: this.pageSize,
    };
    if (this.currentFilters.sortBy) params['sortBy'] = this.currentFilters.sortBy;
    if (this.currentFilters.sortDirection) params['sortDirection'] = this.currentFilters.sortDirection;

    this.adminOrderService.getOrders(params).subscribe({
      next: (res) => {
        this.items.set(res.orders ?? []);
        this.totalCount.set(res.totalRecords ?? 0);
        this.totalPages.set(res.totalPages ?? 0);
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
