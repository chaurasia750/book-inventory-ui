import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type BadgeStatus = 'Pending' | 'Approved' | 'Rejected' | 'PendingApproval' | 'Credited' | string;

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  PendingApproval: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Credited: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const DEFAULT_STYLE = 'bg-gray-50 text-gray-600 border-gray-200';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.html',
})
export class StatusBadgeComponent {
  readonly status = input.required<BadgeStatus>();

  readonly styleClass = computed(() => STATUS_STYLES[this.status()] ?? DEFAULT_STYLE);
}
