import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MemberDataService } from '@org/member-data-access';

@Component({
  selector: 'app-sidebar-stats-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-stats-list.component.html',
})
export class SidebarStatsListComponent {
  readonly data = inject(MemberDataService);

  readonly statRows = [
    { label: "Today's Income", key: 'todayIncome' as const, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Wallet Balance', key: 'walletBalance' as const, color: 'saffron', bg: 'bg-saffron-50', text: 'text-saffron-600' },
    { label: 'Team Business', key: 'teamBusiness' as const, color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600' },
    { label: 'Left BV', key: 'leftBV' as const, color: 'saffron', bg: 'bg-saffron-50', text: 'text-saffron-600' },
    { label: 'Right BV', key: 'rightBV' as const, color: 'saffron', bg: 'bg-saffron-50', text: 'text-saffron-600' },
  ];

  getValue(key: string): number {
    const s = this.data.stats();
    if (!s) return 0;
    return key in s ? (s as unknown as Record<string, number>)[key] : 0;
  }
}
