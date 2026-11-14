import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonComponent, CardComponent } from '@org/ui';
import { AppNotification } from '@org/shared-models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CardComponent, ButtonComponent, DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  readonly notifications = signal<AppNotification[]>([
    {
      id: '1',
      title: 'New user registered',
      message: 'Noah Wilson just created an account.',
      type: 'info',
      read: false,
      createdAt: '2026-07-13T08:10:00Z',
    },
    {
      id: '2',
      title: 'Report generated',
      message: 'Monthly active users report is ready to view.',
      type: 'success',
      read: false,
      createdAt: '2026-07-12T18:30:00Z',
    },
    {
      id: '3',
      title: 'Storage usage high',
      message: 'Your storage usage has reached 85% of the plan limit.',
      type: 'warning',
      read: true,
      createdAt: '2026-07-11T12:00:00Z',
    },
    {
      id: '4',
      title: 'Payment failed',
      message: 'The last billing attempt for Acme Corp failed.',
      type: 'error',
      read: true,
      createdAt: '2026-07-10T09:45:00Z',
    },
  ]);

  markAllRead(): void {
    this.notifications.update((current) => current.map((notification) => ({ ...notification, read: true })));
  }
}
