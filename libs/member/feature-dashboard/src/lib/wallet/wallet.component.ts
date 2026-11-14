import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PoolMemberService, WalletLedgerEntry } from '@org/api-services';

/** Task 12 of Member_Pool_API_And_UI_Plan.md -- the two wallet ledgers. */
@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <!--
        Two wallets, two ledgers, nothing else. The level-by-level story (what each level collected,
        what it sent upward, what it paid) used to be a third tab here as well as a table on the
        Income page -- the same facts in two places, which is what made the two screens confusing.
        It now lives only on Income, and this page is purely the money ledger.
      -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex radius-md border border-default bg-surface p-1">
          <button type="button" (click)="setTab('main')" [class]="tabClass(tab() === 'main')">Main Wallet</button>
          <button type="button" (click)="setTab('upgrade')" [class]="tabClass(tab() === 'upgrade')">Upgrade Wallet</button>
        </div>
        <button type="button" (click)="goToIncome()" class="text-sm font-medium text-accent hover:underline">
          See level-by-level income
        </button>
      </div>

      @if (tab() === 'upgrade') {
        <p class="radius-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          This balance can't be withdrawn. It's fuel for your next level.
        </p>
      }

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="h-9 w-9 animate-spin rounded-full border-2 border-default border-t-[#66B42A]"></div>
        </div>
      } @else if (error()) {
        <p class="radius-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">{{ error() }}</p>
      } @else {
        <div class="radius-card border border-default bg-surface shadow-card">
          @if (ledger().length === 0) {
            <p class="px-5 py-10 text-center text-sm text-secondary-fg">No transactions yet.</p>
          } @else {
            <div class="hidden md:block">
              <table class="w-full text-sm">
                <thead class="text-left text-xs uppercase tracking-wide text-muted-fg">
                  <tr class="border-b border-light">
                    <th class="px-5 py-3 font-medium">Date</th>
                    <th class="px-5 py-3 font-medium">Description</th>
                    <th class="px-5 py-3 font-medium">Credit</th>
                    <th class="px-5 py-3 font-medium">Debit</th>
                    <th class="px-5 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of ledger(); track $index) {
                    <tr class="border-b border-light last:border-0">
                      <td class="px-5 py-3 text-secondary-fg">{{ row.occurredOn | date: 'dd MMM yyyy' }}</td>
                      <td class="px-5 py-3 text-primary-fg">{{ row.description }}</td>
                      <td class="px-5 py-3 font-heading font-semibold text-accent">{{ row.credit > 0 ? '₹' + row.credit.toLocaleString() : '—' }}</td>
                      <td class="px-5 py-3 font-heading font-semibold text-red-600 dark:text-red-400">{{ row.debit > 0 ? '₹' + row.debit.toLocaleString() : '—' }}</td>
                      <td class="px-5 py-3 font-heading font-semibold text-primary-fg">&#8377;{{ row.balance.toLocaleString() }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <!-- Phone layout: description and the movement up top, then date and running balance. -->
            <ul class="md:hidden">
              @for (row of ledger(); track $index) {
                <li class="border-b border-light px-5 py-3.5 last:border-0">
                  <div class="flex items-start justify-between gap-3">
                    <span class="break-words text-sm font-medium text-primary-fg">{{ row.description }}</span>
                    @if (row.credit > 0) {
                      <span class="whitespace-nowrap font-heading text-sm font-semibold text-accent">+&#8377;{{ row.credit.toLocaleString() }}</span>
                    } @else {
                      <span class="whitespace-nowrap font-heading text-sm font-semibold text-red-600 dark:text-red-400">−&#8377;{{ row.debit.toLocaleString() }}</span>
                    }
                  </div>
                  <div class="mt-1 flex items-center justify-between gap-3 text-xs">
                    <span class="text-muted-fg">{{ row.occurredOn | date: 'dd MMM yyyy' }}</span>
                    <span class="text-secondary-fg">Balance &#8377;{{ row.balance.toLocaleString() }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class WalletComponent implements OnInit {
  private readonly pool = inject(PoolMemberService);
  private readonly router = inject(Router);

  readonly tab = signal<'main' | 'upgrade'>('main');
  readonly ledger = signal<WalletLedgerEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loadLedger('main');
  }

  setTab(tab: 'main' | 'upgrade'): void {
    this.tab.set(tab);
    this.loadLedger(tab);
  }

  tabClass(active: boolean): string {
    const base = 'radius-sm px-4 py-1.5 text-sm font-medium transition-colors ';
    return base + (active ? 'bg-accent text-white' : 'text-secondary-fg hover:text-primary-fg');
  }

  /** The level-by-level view lives on Income; this page links there rather than duplicating it. */
  goToIncome(): void {
    this.router.navigate(['/income']);
  }

  private loadLedger(wallet: 'main' | 'upgrade'): void {
    this.loading.set(true);
    this.error.set('');

    this.pool.getWalletLedger(wallet).subscribe({
      next: (rows) => {
        this.ledger.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this wallet.');
        this.loading.set(false);
      },
    });
  }


}
