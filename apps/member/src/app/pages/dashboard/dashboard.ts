import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  ActivityItem,
  LadderRung,
  LevelBreakupRow,
  LevelProgress,
  MemberSummary,
  PoolMemberService,
  TreeNode,
} from '@org/api-services';

interface TreeRow {
  depth: number;
  nodes: TreeNode[];
  /** Unfilled slots at this depth -- a binary tree holds 2^depth nodes per row. */
  emptySlots: number[];
}

/**
 * Task D3 of Member_Dashboard_Rebuild_Plan.md -- the Overview tab. Visual language from the
 * client's mockup (docs/Member_Dashboard_UI/member-dashboard.html), template kept in its own
 * dashboard.html per the client's instruction to split html/ts.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private readonly pool = inject(PoolMemberService);
  private readonly router = inject(Router);

  /** Bead heights in px, Level 1-7, matching the mockup's ladder proportions. */
  private readonly ladderHeights = [34, 42, 52, 64, 78, 94, 112];

  /** Depth the mini tree preview asks for. Two levels fit the card without scrolling. */
  private readonly previewDepth = 2;

  readonly summary = signal<MemberSummary | null>(null);
  readonly treeNodes = signal<TreeNode[]>([]);
  readonly activity = signal<ActivityItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  /**
   * The mini tree as one row per depth, so it reads as a tree rather than a flat pile of names.
   * Empty slots are derived rather than fetched -- the API deliberately omits them (a binary tree
   * holds 2^depth nodes at each depth, so what is missing is arithmetic).
   */
  readonly treeRows = computed<TreeRow[]>(() => {
    const nodes = this.treeNodes();
    if (nodes.length === 0) return [];

    const maxDepth = Math.max(...nodes.map((n) => n.depth));

    return Array.from({ length: maxDepth + 1 }, (_, depth) => {
      const atDepth = nodes.filter((n) => n.depth === depth);
      const capacity = 2 ** depth;
      const missing = Math.max(0, capacity - atDepth.length);

      return {
        depth,
        nodes: atDepth,
        // Only hint at empty slots on the last row; deeper gaps would just be noise here.
        emptySlots: depth === maxDepth ? Array.from({ length: Math.min(missing, 2) }, (_, i) => i) : [],
      };
    });
  });

  /** Levels that actually paid into the Main Wallet. */
  readonly earnedBreakup = computed<LevelBreakupRow[]>(
    () => (this.summary()?.mainWallet.levelBreakup ?? []).filter((r) => r.amount > 0),
  );

  /**
   * Completed levels that paid nothing. Listing them as "₹0" rows alongside real income reads like
   * a missing payment, so they are named once, in words, instead.
   */
  readonly passThroughLevels = computed<number[]>(
    () => (this.summary()?.mainWallet.levelBreakup ?? []).filter((r) => r.amount === 0).map((r) => r.level),
  );

  ngOnInit(): void {
    this.pool.getSummary().subscribe({
      next: (result) => {
        this.summary.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your pool summary.');
        this.loading.set(false);
      },
    });

    this.pool.getTree(undefined, this.previewDepth).subscribe({
      next: (nodes) => this.treeNodes.set(nodes),
      error: () => { /* the preview simply stays empty */ },
    });

    this.pool.getActivity(6).subscribe({
      next: (items) => this.activity.set(items),
      error: () => { /* Recent simply stays empty */ },
    });
  }

  progress(): LevelProgress | null {
    return this.summary()?.currentLevelProgress ?? null;
  }

  /** Rupees with no stray decimals -- SQL hands these back as 10.0000. */
  money(amount: number): string {
    return Math.round(amount).toLocaleString('en-IN');
  }

  /**
   * The one thing on the page that changes from visit to visit. Silent about the level when the
   * week didn't move it, so a quiet week says so plainly instead of padding out with a number.
   */
  thisWeekLine(): string {
    const week = this.summary()?.thisWeek;
    const p = this.progress();
    if (!week) return '';

    const parts: string[] = [];
    parts.push(week.newMembers === 1 ? '1 member joined below you' : `${week.newMembers} members joined below you`);
    if (week.earned > 0) parts.push(`₹${this.money(week.earned)} earned`);
    if (p) parts.push(`Level ${p.level} at ${p.qualifiedMembers}/${p.requiredMembers}`);

    return 'This week: ' + parts.join(' · ');
  }

  rungHeight(level: number): number {
    return this.ladderHeights[level - 1] ?? 34;
  }

  rungClass(state: string): string {
    const base = 'relative flex w-full items-center justify-center overflow-hidden rounded-t-lg text-sm font-semibold ';
    if (state === 'DONE') return base + 'bg-accent text-white';
    if (state === 'CURRENT') return base + 'bg-brand-50 text-primary-fg ring-2 ring-inset ring-[#66B42A] dark:bg-[#66B42A]/10';
    return base + 'bg-body text-muted-fg ring-1 ring-inset ring-[#E2E5E9] dark:ring-[#2A2C30]';
  }

  rungLabelClass(state: string): string {
    const base = 'whitespace-nowrap text-xs ';
    if (state === 'DONE') return base + 'font-medium text-accent';
    if (state === 'CURRENT') return base + 'font-semibold text-primary-fg';
    return base + 'text-muted-fg';
  }

  /**
   * What sits under each rung: what a completed level actually paid, or what an upcoming one will.
   * A completed level that paid nothing says so in words -- "₹0" under a finished level reads as
   * an error rather than as the pass-through it is.
   */
  rungLabel(rung: LadderRung): string {
    if (rung.state === 'DONE') {
      return (rung.incomeEarned ?? 0) > 0 ? '+' + this.shortAmount(rung.incomeEarned ?? 0) : 'Done';
    }
    return this.shortAmount(rung.incomeOnComplete ?? 0);
  }

  treeNodeClass(isRoot: boolean): string {
    // shrink-0 so a long name wraps inside the box instead of squeezing its neighbours.
    const base = 'w-24 shrink-0 radius-md px-2 py-1.5 text-center ';
    return base + (isRoot ? 'bg-accent text-white' : 'border border-default bg-body text-primary-fg');
  }

  membersNeeded(): number {
    const p = this.progress();
    if (!p) return 0;
    return Math.max(0, p.requiredMembers - p.qualifiedMembers);
  }

  /**
   * Says where the remaining contributions come from. "N to go" alone read as "recruit N more
   * people", which is not what fills a level: level N is funded by members below completing level
   * N-1, and their transfer travels up the tree on its own. Level 1 is the exception -- level 0 is
   * the joining fee, so what it waits on is joinings.
   */
  membersNeededLabel(): string {
    const level = this.progress()?.level ?? 0;
    const pending = this.membersNeeded();
    if (level <= 1) return `${pending} more to join below you`;
    return `${pending} more Level ${level - 1} completions below you`;
  }

  progressTicks(): boolean[] {
    const p = this.progress();
    if (!p) return [];
    return Array.from({ length: p.requiredMembers }, (_, i) => i < p.qualifiedMembers);
  }

  activityValueClass(item: ActivityItem): string {
    const base = 'whitespace-nowrap font-heading text-sm ';
    if (item.type === 'POOL_CREDIT') return base + 'font-medium text-secondary-fg';
    if (!item.affectsMainWallet || item.amount === 0) return base + 'font-medium text-muted-fg';
    return base + 'font-semibold text-accent';
  }

  goToWithdrawal(): void {
    this.router.navigate(['/withdrawal']);
  }

  goToTeam(): void {
    this.router.navigate(['/my-team']);
  }

  goToWallet(): void {
    this.router.navigate(['/wallet']);
  }

  /** Lakh/crore shorthand, so the deepest rungs stay readable under a 40px-wide bead. */
  private shortAmount(amount: number): string {
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2).replace(/\.?0+$/, '') + 'Cr';
    if (amount >= 100000) return '₹' + Math.round(amount / 100000) + 'L';
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }
}
