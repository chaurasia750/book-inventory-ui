import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, Optional, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MEMBER_CONTEXT_ID } from '@org/constants';
import { TeamService, MediaService } from '@org/api-services';
import { LevelSummary, LevelMember } from '@org/shared-models';
import { LoadingSpinnerComponent, PaginationComponent } from '@org/ui';

@Component({
  selector: 'app-member-income',
  standalone: true,
  imports: [DatePipe, LoadingSpinnerComponent, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-income.component.html',
  styles: [`
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  `],
})
export class MemberIncomeComponent implements OnInit, OnDestroy {
  @Optional() private readonly memberId = inject(MEMBER_CONTEXT_ID, { optional: true });
  private readonly teamApi = inject(TeamService);
  private readonly mediaService = inject(MediaService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly levels = signal<LevelSummary[]>([]);
  readonly loading = signal(true);
  readonly selectedLevel = signal<number | null>(null);
  readonly members = signal<LevelMember[]>([]);
  readonly membersLoading = signal(false);
  readonly currentPage = signal(1);
  readonly totalRecords = signal(0);
  readonly searchInput = signal('');

  readonly pageSize = 20;
  private searchTermDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _page = this.currentPage();
      const level = this.selectedLevel();
      if (level !== null) {
        this.loadMembers(level);
      }
    });
  }

  ngOnInit(): void {
    this.loadLevels();
  }

  ngOnDestroy(): void {
    if (this.searchTermDebounceTimer) clearTimeout(this.searchTermDebounceTimer);
  }

  private loadLevels(): void {
    this.loading.set(true);
    const memberId = this.memberId?.() || undefined;
    this.teamApi.getLevelSummary(memberId).subscribe({
      next: (levels) => {
        this.levels.set(levels);
        this.loading.set(false);
        if (levels.length > 0) {
          this.selectedLevel.set(levels[0].level);
        }
      },
      error: () => {
        this.levels.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadMembers(level: number): void {
    this.membersLoading.set(true);
    const memberId = this.memberId?.() || undefined;
    this.teamApi
      .getLevelMembers({
        level,
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchInput() || undefined,
        memberId,
      })
      .subscribe({
        next: (res) => {
          this.members.set(res.items);
          this.totalRecords.set(res.totalRecords);
          this.membersLoading.set(false);
        },
        error: () => {
          this.members.set([]);
          this.totalRecords.set(0);
          this.membersLoading.set(false);
        },
      });
  }

  selectLevel(level: number): void {
    if (this.selectedLevel() === level) return;
    this.searchInput.set('');
    this.currentPage.set(1);
    this.selectedLevel.set(level);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onSearchInput(value: string): void {
    this.searchInput.set(value);

    if (this.searchTermDebounceTimer) clearTimeout(this.searchTermDebounceTimer);
    this.searchTermDebounceTimer = setTimeout(() => {
      this.currentPage.set(1);
      const level = this.selectedLevel();
      if (level !== null) {
        this.loadMembers(level);
      }
    }, 500);
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.currentPage.set(1);
    const level = this.selectedLevel();
    if (level !== null) {
      this.loadMembers(level);
    }
    this.cdr.markForCheck();
  }

  applySearch(): void {
    this.currentPage.set(1);
    const level = this.selectedLevel();
    if (level !== null) {
      this.loadMembers(level);
    }
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-IN');
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  hasProfileImage(img: string | null | undefined): boolean {
    return !!img && /^\d+$/.test(img);
  }

  getProfileImageSrc(img: string | null | undefined): string {
    if (!img || !/^\d+$/.test(img)) return '';
    return this.mediaService.getFileUrl(Number(img));
  }
}
