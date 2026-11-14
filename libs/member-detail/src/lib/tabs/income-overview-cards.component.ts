import { ChangeDetectionStrategy, Component, inject, effect, untracked, Optional, OnInit, OnDestroy } from '@angular/core';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { IncomeOverviewService, UserInfoService } from '@org/api-services';
import { StatCardComponent } from '@org/member-ui-sidebar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-income-overview-cards',
  standalone: true,
  imports: [StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (overview.loading()) {
      <div class="grid grid-cols-2 gap-5 sm:grid-cols-4">
        @for (i of [1,2,3,4]; track i) {
          <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
            <div class="h-3 w-20 rounded bg-gray-200"></div>
            <div class="mt-2 h-6 w-24 rounded bg-gray-200"></div>
          </div>
        }
      </div>
    } @else {
      <div class="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <app-stat-card
          label="Wallet Balance"
          [value]="overview.walletBalance()"
          icon="💰"
          color="amber"
        />
        <app-stat-card
          label="Total Income"
          [value]="overview.totalIncome()"
          icon="📈"
          color="green"
        />
        <app-stat-card
          label="Direct Members"
          [value]="overview.directMembers()"
          icon="👥"
          color="saffron"
        />
        <app-stat-card
          label="Total Team"
          [value]="overview.totalTeamMembers()"
          icon="🏗️"
          color="default"
        />
      </div>
    }
  `,
})
export class IncomeOverviewCardsComponent implements OnInit, OnDestroy {
  @Optional() private readonly memberId = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly userInfoApi = inject(UserInfoService);
  readonly overview = inject(IncomeOverviewService);
  private sub?: Subscription;

  constructor() {
    effect(() => {
      if (this.memberId) {
        const id = this.memberId();
        if (id) {
          untracked(() => this.overview.load(id));
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.memberId) {
      this.sub = this.userInfoApi.getUserInfo().subscribe({
        next: (info) => {
          if (info.memberId) {
            this.overview.load(info.memberId);
          }
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
