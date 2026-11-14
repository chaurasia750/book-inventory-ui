import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent, TableColumn, TableComponent } from '@org/ui';

interface ActivityLogRow {
  timestamp: string;
  user: string;
  action: string;
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CardComponent, TableComponent],
  templateUrl: './activity-logs.html',
  styleUrl: './activity-logs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogsComponent {
  readonly columns: TableColumn[] = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'user', label: 'User' },
    { key: 'action', label: 'Action' },
  ];

  readonly rows: ActivityLogRow[] = [
    { timestamp: '2026-07-13 09:12', user: 'Jane Doe', action: 'Signed in' },
    { timestamp: '2026-07-13 08:47', user: 'Mark Lee', action: 'Viewed dashboard' },
    { timestamp: '2026-07-12 17:35', user: 'Priya Singh', action: 'Exported audit logs' },
    { timestamp: '2026-07-12 15:02', user: 'Carlos Diaz', action: 'Updated role permissions' },
    { timestamp: '2026-07-12 09:20', user: 'Amelia Chen', action: 'Signed in' },
    { timestamp: '2026-07-11 14:10', user: 'Noah Wilson', action: 'Reset password' },
  ];
}
