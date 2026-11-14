import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Optional, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { PaginationComponent } from '@org/ui';
import { UserLoginHistoryItem, UserLoginHistoryService } from '@org/api-services';

@Component({
  selector: 'app-member-activity',
  standalone: true,
  imports: [DatePipe, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-activity.component.html',
})
export class MemberActivityComponent implements OnInit {
  @Optional() private readonly memberId = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly route = inject(ActivatedRoute);
  private readonly loginHistoryApi = inject(UserLoginHistoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loginHistory = signal<UserLoginHistoryItem[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);

  ngOnInit(): void {
    const memberId = this.route.snapshot.paramMap.get('memberId') ?? this.memberId?.();
    if (memberId) {
      this.fetchLoginHistory({ memberId, pageIndex: 1 });
    } else {
      this.fetchLoginHistory({ pageIndex: 1 });
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    const memberId = this.route.snapshot.paramMap.get('memberId') ?? this.memberId?.();
    this.fetchLoginHistory(memberId ? { memberId, pageIndex: page } : { pageIndex: page });
  }

  private fetchLoginHistory(params?: { memberId?: string; pageIndex?: number }): void {
    this.loginHistoryApi.getLoginHistory({ pageSize: this.pageSize, ...params }).subscribe({
      next: (res) => {
        this.loginHistory.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(Math.max(1, Math.ceil(res.totalCount / this.pageSize)));
        this.loading.set(false);
      },
      error: () => {
        this.loginHistory.set([]);
        this.loading.set(false);
      },
    });
  }

  sortedByBrowser(): UserLoginHistoryItem[] {
    return [...this.loginHistory()].sort((a, b) =>
      this.formatBrowser(a.browser).localeCompare(this.formatBrowser(b.browser))
    );
  }

  formatBrowser(ua: string): string {
    const s = ua || '';
    const edge = s.match(/Edg[ea]?\/([\d.]+)/);
    if (edge) return `Microsoft Edge ${edge[1]}`;
    const opera = s.match(/(?:OPR|Opera)\/([\d.]+)/);
    if (opera) return `Opera ${opera[1]}`;
    const firefox = s.match(/Firefox\/([\d.]+)/);
    if (firefox) return `Firefox ${firefox[1]}`;
    const chrome = s.match(/Chrome\/([\d.]+)/);
    if (chrome) return `Chrome ${chrome[1]}`;
    const safari = s.match(/Version\/([\d.]+)[^;]*\sSafari/);
    if (safari) return `Safari ${safari[1]}`;
    return s.split(/[/ (]/)[0] || s;
  }

  formatDevice(ua: string): string {
    const s = ua || '';
    if (/iPad|Tablet|Silk\//.test(s)) return 'Tablet';
    if (/Windows Phone|IEMobile|WPDesktop/.test(s)) return 'Windows Phone';
    if (/iPhone|iPod/.test(s)) return 'iPhone';
    if (/Android/.test(s)) return 'Android';
    if (/Mobi/.test(s)) return 'Mobile';
    return 'Desktop';
  }
}
