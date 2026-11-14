import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@org/ui';

export interface OrderFilters {
  search: string;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  loginId: string;
  sortBy: string;
  sortDirection: string;
}

@Component({
  selector: 'app-order-filters',
  standalone: true,
  imports: [FormsModule, DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-filters.component.html',
})
export class OrderFiltersComponent {
  search = '';
  orderType = '';
  orderStatus = '';
  paymentStatus = '';
  dateFrom = '';
  dateTo = '';
  loginId = '';
  sortBy = 'CreatedDate';
  sortDirection = 'Desc';

  showAdvanced = false;

  filterChange = output<OrderFilters>();
  searchClick = output<OrderFilters>();
  clearClick = output<void>();

  onSearch(): void {
    this.searchClick.emit(this.getFilters());
  }

  onClear(): void {
    this.search = '';
    this.orderType = '';
    this.orderStatus = '';
    this.paymentStatus = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.loginId = '';
    this.sortBy = 'CreatedDate';
    this.sortDirection = 'Desc';
    this.clearClick.emit();
  }

  hasActiveFilters(): boolean {
    return !!(this.orderType || this.paymentStatus || this.loginId);
  }

  private getFilters(): OrderFilters {
    return {
      search: this.search,
      orderType: this.orderType,
      orderStatus: this.orderStatus,
      paymentStatus: this.paymentStatus,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      loginId: this.loginId,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
    };
  }
}
