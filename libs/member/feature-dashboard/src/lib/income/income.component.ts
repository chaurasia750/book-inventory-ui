import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { IncomeStatement, LevelIncomeRow, PoolMemberService } from '@org/api-services';

/**
 * Task 11 of Member_Pool_API_And_UI_Plan.md -- the Income tab.
 *
 * Earned and payable-on-completion are shown as separate columns rather than one "Income" figure.
 * The single column read as though the member had already been paid for levels they have not
 * reached, and could not be reconciled against the total at the top.
 */
@Component({
  selector: 'app-income',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './income.component.html',
})
export class IncomeComponent implements OnInit {
  private readonly pool = inject(PoolMemberService);
  private readonly router = inject(Router);

  readonly income = signal<IncomeStatement | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly currentRow = computed<LevelIncomeRow | undefined>(
    () => this.income()?.levelSummary.find((r) => r.state === 'CURRENT'),
  );

  /**
   * Levels that pay nothing, read off the data rather than hardcoded -- the Level Master is
   * admin-editable, so which levels are pure pass-through can change.
   */
  readonly passThroughLevels = computed<number[]>(
    () => (this.income()?.levelSummary ?? [])
      .filter((r) => (r.earned ?? r.payableOnComplete ?? 0) === 0)
      .map((r) => r.levelNo),
  );

  ngOnInit(): void {
    this.pool.getIncome().subscribe({
      next: (result) => {
        this.income.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your income statement.');
        this.loading.set(false);
      },
    });
  }

  /** Rupees with no stray decimals -- SQL hands these back as 10.0000. */
  money(amount: number): string {
    return Math.round(amount).toLocaleString('en-IN');
  }

  stateLabel(row: LevelIncomeRow): string {
    if (row.state === 'DONE') return 'Completed';
    if (row.state === 'CURRENT') return `In progress · ${row.receivedMembers}/${row.requiredMembers}`;
    return 'Locked';
  }

  stateClass(row: LevelIncomeRow): string {
    const base = 'radius-sm px-2.5 py-1 text-xs font-medium ';
    if (row.state === 'DONE') return base + 'bg-brand-50 text-brand-700 dark:bg-[#66B42A]/15 dark:text-brand-300';
    if (row.state === 'CURRENT') return base + 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300';
    return base + 'bg-body text-muted-fg';
  }

  /** How full the current level's pool is, for the inline progress bar. */
  fillPercent(row: LevelIncomeRow): number {
    if (row.requiredAmount <= 0) return 0;
    return Math.min(100, Math.round((row.collectedAmount / row.requiredAmount) * 100));
  }

  /** Transactions live on the Wallet tab, so this page links there rather than repeating them. */
  goToWallet(): void {
    this.router.navigate(['/wallet']);
  }
}
