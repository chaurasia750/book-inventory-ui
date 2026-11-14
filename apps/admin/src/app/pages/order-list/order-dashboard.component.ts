import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AdminOrderSummary } from '@org/shared-models';

@Component({
  selector: 'app-order-dashboard',
  standalone: true,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-dashboard.component.html',
})
export class OrderDashboardComponent {
  summary = input.required<AdminOrderSummary>();
}
