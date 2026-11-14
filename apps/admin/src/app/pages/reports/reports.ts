import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent, TableColumn, TableComponent } from '@org/ui';

interface MonthlyActiveUserRow {
  month: string;
  users: number;
  change: string;
}

interface RevenueRow {
  month: string;
  revenue: string;
  change: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CardComponent, TableComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  readonly mauColumns: TableColumn[] = [
    { key: 'month', label: 'Month' },
    { key: 'users', label: 'Active Users' },
    { key: 'change', label: 'Change' },
  ];

  readonly mauRows: MonthlyActiveUserRow[] = [
    { month: 'April 2026', users: 1085, change: '+3.1%' },
    { month: 'May 2026', users: 1142, change: '+5.3%' },
    { month: 'June 2026', users: 1207, change: '+5.7%' },
    { month: 'July 2026', users: 1284, change: '+6.4%' },
  ];

  readonly revenueColumns: TableColumn[] = [
    { key: 'month', label: 'Month' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'change', label: 'Change' },
  ];

  readonly revenueRows: RevenueRow[] = [
    { month: 'April 2026', revenue: '$41,200', change: '+2.4%' },
    { month: 'May 2026', revenue: '$44,650', change: '+8.4%' },
    { month: 'June 2026', revenue: '$46,900', change: '+5.0%' },
    { month: 'July 2026', revenue: '$48,920', change: '+4.3%' },
  ];
}
