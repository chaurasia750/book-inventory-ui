import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MemberIncomeService, TeamIncomeActivityItem } from '@org/api-services';
import { PaginationComponent } from '@org/ui';

/**
 * Member-facing team income activity feed. Deliberately generic -- no level
 * numbers, no Company Root -- per
 * docs/requirement/Level_Income_Display_Approach.md. Admin gets the full
 * level-by-level breakdown via IncomeChartComponent instead; this component
 * is only for a member viewing their own earnings.
 *
 * Paginates in place (same app-pagination convention used elsewhere in this
 * app, e.g. the Income tab's member lists) so a member with many direct/team
 * credits never turns this card into an unbounded list.
 */
@Component({
  selector: 'app-team-income-summary',
  standalone: true,
  imports: [CurrencyPipe, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-income-summary.component.html',
})
export class TeamIncomeSummaryComponent implements OnChanges {
  private static readonly directReferralIcon =
    '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>';
  private static readonly teamIncomeIcon =
    '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';

  private readonly incomeApi = inject(MemberIncomeService);
  private readonly sanitizer = inject(DomSanitizer);
  // Angular's default [innerHTML] sanitizer strips raw <svg>/<path> tags (not in
  // its safe-elements list), so these need to be marked explicitly trusted --
  // safe here since the markup is a fixed literal, never user/API-supplied.
  private readonly directReferralIconSafe: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    TeamIncomeSummaryComponent.directReferralIcon,
  );
  private readonly teamIncomeIconSafe: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    TeamIncomeSummaryComponent.teamIncomeIcon,
  );

  @Input({ required: true }) memberId!: string;

  readonly pageSize = 5;
  readonly totalTeamIncome = signal(0);
  readonly items = signal<TeamIncomeActivityItem[]>([]);
  readonly page = signal(1);
  readonly totalRecords = signal(0);
  readonly loading = signal(true);

  ngOnChanges(): void {
    if (!this.memberId) return;
    this.page.set(1);
    this.loadSummary();
    this.loadActivityPage(1);
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadActivityPage(page);
  }

  private loadSummary(): void {
    this.incomeApi.getTeamIncomeSummary(this.memberId).subscribe({
      next: (summary) => this.totalTeamIncome.set(summary.totalTeamIncome),
      error: () => this.totalTeamIncome.set(0),
    });
  }

  private loadActivityPage(page: number): void {
    this.loading.set(true);
    this.incomeApi.getTeamIncomeActivity(this.memberId, page, this.pageSize).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.totalRecords.set(result.totalRecords);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.totalRecords.set(0);
        this.loading.set(false);
      },
    });
  }

  isDirectReferral(subtitle: string): boolean {
    return subtitle === 'Your direct referral';
  }

  iconFor(subtitle: string): SafeHtml {
    return this.isDirectReferral(subtitle) ? this.directReferralIconSafe : this.teamIncomeIconSafe;
  }

  timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';

    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;

    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
