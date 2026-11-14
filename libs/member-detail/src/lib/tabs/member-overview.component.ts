import { ChangeDetectionStrategy, Component, inject, OnInit, Optional, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { MemberIncomeService, LevelIncomeOverview, UserInfoService, OrderService } from '@org/api-services';
import { HowToUseComponent } from '@org/ui';
import { OrderListItem } from '@org/shared-models';
import { IncomeChartComponent } from './income-chart.component';
import { TeamIncomeSummaryComponent } from './team-income-summary.component';
import { IncomeOverviewCardsComponent } from './income-overview-cards.component';
import { RecentTransactionsComponent } from './recent-transactions.component';

@Component({
  selector: 'app-member-overview',
  standalone: true,
  imports: [IncomeChartComponent, TeamIncomeSummaryComponent, IncomeOverviewCardsComponent, RecentTransactionsComponent, HowToUseComponent, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-overview.component.html',
})
export class MemberOverviewComponent implements OnInit {
  @Optional() private readonly memberId = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly userInfoApi = inject(UserInfoService);
  private readonly incomeApi = inject(MemberIncomeService);
  private readonly orderApi = inject(OrderService);

  // Present only when an admin is viewing someone else's profile (see
  // apps/admin/.../member-profile-page.component.ts, the only place that
  // provides MEMBER_CONTEXT_ID). Admin gets the full level breakdown; a
  // member viewing their own dashboard gets the generic team-income summary
  // -- see docs/requirement/Level_Income_Display_Approach.md.
  readonly isAdminContext = !!this.memberId;

  readonly levelData = signal<LevelIncomeOverview[]>([]);
  readonly ownMemberId = signal<string | null>(null);
  readonly loadingLevel = signal(true);

  readonly recentOrders = signal<OrderListItem[]>([]);
  readonly loadingOrders = signal(true);

  // Guide state: shown instead of income widgets while the member has never
  // purchased an order (GET /orders/has-no-purchased-order).
  readonly showGuide = signal(false);
  readonly guideLoaded = signal(false);
  readonly contextMemberId: string | null = this.memberId?.() ?? null;

  ngOnInit(): void {
    if (this.memberId) {
      const id = this.memberId();
      if (id) {
        this.loadGuideState(id);
        this.fetchLevelIncome(id);
        this.fetchRecentOrders();
      }
    } else {
      this.userInfoApi.getUserInfo().subscribe({
        next: (info) => {
          if (info.memberId) {
            this.ownMemberId.set(info.memberId);
            this.loadGuideState();
          }
          this.loadingLevel.set(false);
          this.fetchRecentOrders();
        },
      });
    }
  }

  private loadGuideState(memberId?: string): void {
    this.orderApi.hasNoPurchasedOrder(memberId).subscribe({
      next: (noOrder) => {
        this.showGuide.set(noOrder);
        this.guideLoaded.set(true);
      },
      error: () => this.guideLoaded.set(true),
    });
  }

  private fetchLevelIncome(memberId: string): void {
    this.incomeApi.getLevelIncomeOverview(memberId).subscribe({
      next: (data) => {
        this.levelData.set(data);
        this.loadingLevel.set(false);
      },
      error: () => this.loadingLevel.set(false),
    });
  }

  private fetchRecentOrders(): void {
    this.orderApi.getMyOrders({ page: 1, pageSize: 5 }).subscribe({
      next: (res) => {
        this.recentOrders.set(res.items);
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false),
    });
  }

  statusColor(status: string): string {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'pending' || s === 'pendingpayment' || s === 'paymentreceived') return 'bg-amber-100 text-amber-700';
    if (s === 'rejected' || s === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  }
}
