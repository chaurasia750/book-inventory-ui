import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AdminDashboardService,
  DashboardLevelDistribution,
  DashboardPosition,
  DashboardQueue,
  JoiningsResponse,
  ReconciliationResponse,
  StuckMemberRow,
  StuckMembersResponse,
  TreeHealthResponse,
} from '@org/api-services';

/**
 * Task 8 of docs/plan/Admin_Dashboard_And_Reports_Plan.md. Reconciliation leads (spec Part 1's
 * ordering: does the money balance, what's owed, what needs doing today, who's stuck) -- everything
 * else on the old dashboard (hardcoded stat cards, a plain member list) is gone, replaced with the
 * seven live queries this depends on.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p class="text-sm text-gray-500">{{ today | date: 'dd MMMM yyyy' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-24">
          <div class="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[#66B42A]"></div>
        </div>
      } @else if (error()) {
        <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ error() }}</p>
      } @else {
        <!-- Reconciliation hero -->
        <section
          class="rounded-2xl border bg-white p-5"
          [class]="recon()!.isBalanced ? 'border-gray-100 border-l-4 border-l-green-600' : 'border-gray-100 border-l-4 border-l-red-600'"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-gray-900">Today's Reconciliation</h2>
              <p class="text-xs text-gray-400">Every rupee that enters the pool should be accounted for</p>
            </div>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              [class]="recon()!.isBalanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            >
              @if (recon()!.isBalanced) {
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>
                Balanced
              } @else {
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
                Not balanced
              }
            </span>
          </div>

          <div class="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div>
              <h6 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Inflow</h6>
              <ul class="divide-y divide-gray-100 text-sm">
                <li class="flex justify-between py-1.5"><em class="not-italic text-gray-500">New members</em><b class="font-semibold text-gray-900">{{ recon()!.inflow.newMembers }}</b></li>
                <li class="flex justify-between border-t-2 border-gray-900 pt-2 py-1.5"><em class="not-italic text-gray-500">Pool contribution (cumulative)</em><b class="font-semibold text-gray-900">&#8377;{{ money(recon()!.inflow.poolContribution) }}</b></li>
              </ul>
            </div>
            <div class="hidden text-2xl text-gray-300 md:block">=</div>
            <div>
              <h6 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Outflow</h6>
              <ul class="divide-y divide-gray-100 text-sm">
                <li class="flex justify-between py-1.5"><em class="not-italic text-gray-500">To members (Main Wallet)</em><b class="font-semibold text-gray-900">&#8377;{{ money(recon()!.outflow.toMemberMainWallets) }}</b></li>
                <li class="flex justify-between py-1.5"><em class="not-italic text-gray-500">Company wallet (X1-X7)</em><b class="font-semibold text-gray-900">&#8377;{{ money(recon()!.outflow.toCompanyWallet) }}</b></li>
                <li class="flex justify-between py-1.5"><em class="not-italic text-gray-500">Still in level pools (in progress)</em><b class="font-semibold text-gray-900">&#8377;{{ money(recon()!.outflow.unallocated) }}</b></li>
                <li class="flex justify-between border-t-2 border-gray-900 pt-2 py-1.5"><em class="not-italic text-gray-500">Total out</em><b class="font-semibold text-gray-900">&#8377;{{ money(recon()!.outflow.totalOut) }}</b></li>
              </ul>
            </div>
          </div>

          <div class="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
            @if (recon()!.isBalanced) {
              Balanced as of today. This checks every rupee ever collected against every rupee paid out or still sitting in an in-progress level -- not just today's activity.
            } @else {
              &#8377;{{ money(recon()!.difference) }} cannot be accounted for. Check the upgrade log -- a transaction likely committed only part-way.
            }
          </div>
        </section>

        <!-- Action queue -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button type="button" (click)="goTo('/admin/withdrawals')" class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-gray-300">
            <div>
              <b class="block text-2xl font-semibold" [class]="queue()!.withdrawalsPending > 0 ? 'text-red-600' : 'text-gray-900'">{{ queue()!.withdrawalsPending }}</b>
              <span class="text-xs text-gray-500">Withdrawals pending</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-gray-300"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button type="button" (click)="goTo('/admin/kyc')" class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-gray-300">
            <div>
              <b class="block text-2xl font-semibold" [class]="queue()!.kycPending > 0 ? 'text-amber-600' : 'text-gray-900'">{{ queue()!.kycPending }}</b>
              <span class="text-xs text-gray-500">KYC verification pending</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-gray-300"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4">
            <div>
              <b class="block text-2xl font-semibold text-gray-900">{{ queue()!.bankVerifyPending }}</b>
              <span class="text-xs text-gray-500">Bank verify pending</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4">
            <div>
              <b class="block text-2xl font-semibold" [class]="queue()!.failedJobs > 0 ? 'text-red-600' : 'text-gray-900'">{{ queue()!.failedJobs }}</b>
              <span class="text-xs text-gray-500">Failed jobs</span>
            </div>
          </div>
        </div>

        @if (queue()!.oldestPendingWithdrawalDays > 7) {
          <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            The oldest pending withdrawal has been waiting {{ queue()!.oldestPendingWithdrawalDays }} days. Late withdrawals are the most common source of complaints.
          </p>
        }

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- Money position -->
          <section class="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 class="text-[15px] font-semibold text-gray-900">Money Position</h3>
            <p class="mb-4 text-xs text-gray-400">Total to date</p>
            <ul class="divide-y divide-gray-100 text-sm">
              <li class="flex items-baseline justify-between gap-3 py-2.5">
                <div><span>Member balances held</span><small class="block text-[11px] text-gray-400">Not yet withdrawn -- a company liability</small></div>
                <b class="whitespace-nowrap text-lg font-semibold text-amber-600">&#8377;{{ money(position()!.memberLiability) }}</b>
              </li>
              <li class="flex items-baseline justify-between gap-3 py-2.5">
                <div><span>Company wallet</span><small class="block text-[11px] text-gray-400">Held in X1-X7 accounts</small></div>
                <b class="whitespace-nowrap text-lg font-semibold text-green-700">&#8377;{{ money(position()!.companyWallet) }}</b>
              </li>
              <li class="flex items-baseline justify-between gap-3 py-2.5">
                <div><span>Withdrawn</span><small class="block text-[11px] text-gray-400">Bank transfer complete</small></div>
                <b class="whitespace-nowrap text-lg font-semibold text-gray-900">&#8377;{{ money(position()!.totalWithdrawn) }}</b>
              </li>
              <li class="flex items-baseline justify-between gap-3 py-2.5">
                <div><span>Stuck in level pools</span><small class="block text-[11px] text-gray-400">Sitting in incomplete levels, not yet anyone's</small></div>
                <b class="whitespace-nowrap text-lg font-semibold text-gray-900">&#8377;{{ money(position()!.stuckInLevelPools) }}</b>
              </li>
            </ul>
          </section>

          <!-- Joinings -->
          <section class="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 class="text-[15px] font-semibold text-gray-900">Daily Joinings</h3>
            <p class="mb-4 text-xs text-gray-400">Last {{ joinings()!.series.length }} days &middot; today {{ todayCount() }}</p>
            <div class="mb-2 flex h-32 items-end gap-1">
              @for (day of joinings()!.series; track day.date) {
                <div
                  class="flex-1 rounded-t"
                  [class]="day.date === todayIso ? 'bg-green-700' : 'bg-gray-700'"
                  [style.height.%]="barHeight(day.count)"
                  [title]="day.date + ': ' + day.count"
                ></div>
              }
            </div>
            <div class="flex justify-between text-[11px] text-gray-400">
              <span>{{ joinings()!.series[0].date | date: 'd MMM' }}</span>
              <span>{{ joinings()!.series[joinings()!.series.length - 1].date | date: 'd MMM' }}</span>
            </div>
          </section>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- Level distribution -->
          <section class="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 class="text-[15px] font-semibold text-gray-900">Members by Level</h3>
            <p class="mb-4 text-xs text-gray-400">Total {{ levelDist()!.totalMembers }} members</p>
            <ul class="space-y-1.5">
              @for (row of levelDist()!.levels; track row.level) {
                <li class="grid grid-cols-[52px_1fr_78px] items-center gap-2.5">
                  <span class="text-xs text-gray-500">Level {{ row.level }}</span>
                  <span class="h-4 overflow-hidden rounded bg-gray-100">
                    <span class="block h-full rounded" [class]="row.level <= 4 ? 'bg-gray-700' : 'bg-gray-400'" [style.width.%]="row.percent"></span>
                  </span>
                  <span class="text-right text-sm font-semibold text-gray-900">{{ row.count }}<small class="ml-1 font-normal text-gray-400">{{ row.percent }}%</small></span>
                </li>
              }
            </ul>
          </section>

          <!-- Tree health -->
          <section class="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 class="text-[15px] font-semibold text-gray-900">Tree Health</h3>
            <p class="mb-4 text-xs text-gray-400">Binary tree, breadth-first fill</p>
            <ul class="divide-y divide-gray-100 text-sm">
              <li class="flex items-baseline justify-between py-2.5"><div><span>Tree depth</span><small class="block text-[11px] text-gray-400">Root to the deepest row</small></div><b class="text-lg font-semibold text-gray-900">{{ treeHealth()!.treeDepth }}</b></li>
              <li class="flex items-baseline justify-between py-2.5"><div><span>Last row</span><small class="block text-[11px] text-gray-400">Row {{ treeHealth()!.lastRow.row }} &middot; {{ treeHealth()!.lastRow.filled }} of {{ treeHealth()!.lastRow.capacity }} filled</small></div><b class="text-lg font-semibold text-gray-900">{{ treeHealth()!.lastRow.fillPercent }}%</b></li>
              @if (treeHealth()!.nextPlacement; as next) {
                <li class="flex items-baseline justify-between py-2.5"><div><span>Next placement</span><small class="block text-[11px] text-gray-400">Under {{ next.parentCode || '—' }}, {{ next.side }} side</small></div><b class="text-lg font-semibold text-gray-900">R{{ next.row }}</b></li>
              }
              <li class="flex items-baseline justify-between py-2.5"><div><span>Members in bottom 2 rows</span><small class="block text-[11px] text-gray-400">Nothing below them yet</small></div><b class="text-lg font-semibold text-amber-600">{{ treeHealth()!.bottomTwoRowsPercent }}%</b></li>
            </ul>
          </section>
        </div>

        <!-- Stuck members -->
        <section class="rounded-2xl border border-gray-100 bg-white p-5">
          <div class="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 class="text-[15px] font-semibold text-gray-900">Long-Stuck Members</h3>
              <p class="text-xs text-gray-400">These are the members most likely to complain -- check them first</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-[11px] uppercase tracking-wide text-gray-400">
                <tr class="border-b border-gray-100">
                  <th class="pb-2 pr-3 font-medium">Member</th>
                  <th class="pb-2 pr-3 font-medium">Level</th>
                  <th class="pb-2 pr-3 font-medium">Progress</th>
                  <th class="pb-2 pr-3 font-medium">Days stuck</th>
                  <th class="pb-2 pr-3 font-medium">Earned</th>
                  <th class="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (row of stuckMembers()!.items; track row.memberRegNo) {
                  <tr class="border-b border-gray-50 last:border-0">
                    <td class="py-2.5 pr-3"><span class="font-semibold text-gray-900">{{ row.registrationNumber }}</span><div class="text-xs text-gray-400">{{ row.name }}</div></td>
                    <td class="py-2.5 pr-3 text-gray-600">Level {{ row.currentLevel }}</td>
                    <td class="py-2.5 pr-3 text-gray-400">{{ row.qualifiedMembers }} of {{ row.requiredMembers }}</td>
                    <td class="py-2.5 pr-3 font-semibold text-gray-900">{{ row.daysAtLevel }}</td>
                    <td class="py-2.5 pr-3 text-gray-900">&#8377;{{ money(row.totalEarned) }}</td>
                    <td class="py-2.5">
                      <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="riskClass(row.riskBand)">{{ riskLabel(row.riskBand) }}</span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="py-8 text-center text-sm text-gray-400">Nobody is stuck right now.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(AdminDashboardService);
  private readonly router = inject(Router);

  readonly today = new Date();
  readonly todayIso = this.today.toISOString().slice(0, 10);

  readonly recon = signal<ReconciliationResponse | null>(null);
  readonly queue = signal<DashboardQueue | null>(null);
  readonly position = signal<DashboardPosition | null>(null);
  readonly joinings = signal<JoiningsResponse | null>(null);
  readonly levelDist = signal<DashboardLevelDistribution | null>(null);
  readonly treeHealth = signal<TreeHealthResponse | null>(null);
  readonly stuckMembers = signal<StuckMembersResponse | null>(null);

  readonly loading = signal(true);
  readonly error = signal('');

  private readonly maxJoiningCount = computed(() => {
    const series = this.joinings()?.series ?? [];
    return Math.max(1, ...series.map((d) => d.count));
  });

  ngOnInit(): void {
    forkJoin({
      recon: this.dashboard.getReconciliation(),
      queue: this.dashboard.getQueue(),
      position: this.dashboard.getPosition(),
      joinings: this.dashboard.getJoinings(14),
      levelDist: this.dashboard.getLevelDistribution(),
      treeHealth: this.dashboard.getTreeHealth(),
      stuckMembers: this.dashboard.getStuckMembers(25, 10),
    }).subscribe({
      next: (result) => {
        this.recon.set(result.recon);
        this.queue.set(result.queue);
        this.position.set(result.position);
        this.joinings.set(result.joinings);
        this.levelDist.set(result.levelDist);
        this.treeHealth.set(result.treeHealth);
        this.stuckMembers.set(result.stuckMembers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the dashboard.');
        this.loading.set(false);
      },
    });
  }

  money(amount: number): string {
    return Math.round(amount).toLocaleString('en-IN');
  }

  barHeight(count: number): number {
    return Math.max(3, Math.round((count / this.maxJoiningCount()) * 100));
  }

  todayCount(): number {
    return this.joinings()?.series.find((d) => d.date === this.todayIso)?.count ?? 0;
  }

  riskClass(band: StuckMemberRow['riskBand']): string {
    if (band === 'RISK') return 'bg-red-50 text-red-700';
    if (band === 'WATCH') return 'bg-amber-50 text-amber-700';
    return 'bg-gray-100 text-gray-500';
  }

  riskLabel(band: StuckMemberRow['riskBand']): string {
    if (band === 'RISK') return 'Risk';
    if (band === 'WATCH') return 'Watch';
    return 'Normal';
  }

  goTo(path: string): void {
    this.router.navigateByUrl(path);
  }
}
