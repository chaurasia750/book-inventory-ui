import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@org/auth';
import { DashboardService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Dashboard, DashboardOwedGroup } from '@org/shared-models';
import { ButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { IndianCurrencyPipe } from '../counters/indian-currency.pipe';

const CARD = 'rounded-[10px] border border-neutral-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800';
const TITLE = 'm-0 mb-3 text-sm font-semibold uppercase tracking-[0.05em] text-gray-500';
const BIG = 'm-0 font-mono text-2xl font-semibold text-primary-fg';
const TILE = 'min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-charcoal-700';
const ROW ='flex items-center justify-between gap-3 py-1 text-sm';
const CHART_WIDTH = 240;
const CHART_HEIGHT = 56;

/**
 * The Home page of the member app: the dashboard (report spec R1-R13). A session is chosen at the top (the current one first); the
 * quick buttons and the cards follow: payments received (and what came in for earlier sessions' invoices), orders and invoices,
 * today's and the session's sales with a small day-wise line, returns and refunds, what is owed, and the stock. The server answers
 * each part on its own: a part that failed shows its message here and the others still show; a part the caller may not see (Staff)
 * is simply not in the answer.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, ButtonComponent, SkeletonLoaderComponent, IndianCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-primary-fg">{{ 'dashboard.title' | translate }}</h1>
          @if (data(); as d) { <p class="mt-0.5 text-sm text-gray-500">{{ d.from | date: 'dd MMM yyyy' }} - {{ d.to | date: 'dd MMM yyyy' }}</p> }
        </div>
        <div class="flex items-center gap-2">
          <label for="db-session" class="text-xs font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'dashboard.session' | translate }}</label>
          <select id="db-session" (change)="choose($any($event.target).value)" class="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
            @for (s of data()?.sessions ?? []; track s.label) { <option [value]="s.label" [selected]="s.label === (data()?.session)">{{ s.label }}@if (s.isCurrent) { ({{ 'dashboard.current' | translate }}) }</option> }
          </select>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <a routerLink="/orders"><app-button>{{ 'dashboard.buttons.newOrder' | translate }}</app-button></a>
        @if (isOwner) { <a routerLink="/schools"><app-button variant="secondary">{{ 'dashboard.buttons.payment' | translate }}</app-button></a> }
        <a routerLink="/counters"><app-button variant="secondary">{{ 'dashboard.buttons.counter' | translate }}</app-button></a>
      </div>

      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      }
      @if (loading() && !data()) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">@for (i of placeholders; track i) { <div class="${CARD}"><app-skeleton-loader width="60%" /><app-skeleton-loader width="100%" /><app-skeleton-loader width="80%" /></div> }</div>
      }

      @if (data(); as d) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @if (d.payments; as part) {
            <section class="${CARD}" aria-labelledby="db-pay">
              <h2 id="db-pay" class="${TITLE}">{{ 'dashboard.payments.title' | translate }}</h2>
              @if (part.data; as p) {
                <p class="${BIG}">{{ p.received.total | inr }}</p>
                <p class="m-0 mb-2 text-xs text-gray-500">{{ 'dashboard.payments.received' | translate }} · {{ p.received.receipts }} {{ 'dashboard.payments.receipts' | translate }}</p>
                @for (m of p.received.byMode; track m.mode) { <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.payments.mode.' + m.mode | translate }}</span><span class="font-mono">{{ m.amount | inr }}</span></div> }
                <div class="mt-2 border-t border-neutral-200 pt-2 dark:border-charcoal-700">
                  <div class="${ROW}"><span>{{ 'dashboard.payments.earlier' | translate }}</span><span class="font-mono font-semibold">{{ p.earlierSessions.amount | inr }}</span></div>
                  <p class="m-0 text-xs text-gray-500">{{ p.earlierSessions.schools }} {{ 'dashboard.payments.schools' | translate }} · {{ 'dashboard.payments.stillDue' | translate }} {{ p.earlierSessions.stillDue | inr }}</p>
                </div>
                <div class="${ROW} mt-1"><span>{{ 'dashboard.payments.pending' | translate }} ({{ p.pendingCheques.count }})</span><span class="font-mono">{{ p.pendingCheques.amount | inr }}</span></div>
              } @else { <p class="m-0 text-sm text-red-600" role="alert">{{ 'dashboard.partFailed' | translate }}</p> }
            </section>
          }

          <section class="${CARD}" aria-labelledby="db-ord">
            <h2 id="db-ord" class="${TITLE}">{{ 'dashboard.orders.title' | translate }}</h2>
            @if (d.orders.data; as o) {
              @for (s of o.byStatus; track s.status) { <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.orders.' + s.status | translate }} ({{ s.count }})</span><span class="font-mono">{{ s.total | inr }}</span></div> }
              <div class="mt-2 border-t border-neutral-200 pt-2 dark:border-charcoal-700">
                <div class="${ROW}"><span>{{ 'dashboard.orders.invoices' | translate }} ({{ o.invoicesLive }})</span><span class="font-mono font-semibold">{{ o.invoicesTotal | inr }}</span></div>
                <p class="m-0 text-xs text-gray-500">{{ o.invoicesCancelled }} {{ 'dashboard.orders.cancelled' | translate }} · {{ o.stillToInvoiceQuantity }} {{ 'dashboard.orders.stillToInvoice' | translate }}</p>
              </div>
            } @else { <p class="m-0 text-sm text-red-600" role="alert">{{ 'dashboard.partFailed' | translate }}</p> }
          </section>

          <section class="${CARD}" aria-labelledby="db-sales">
            <h2 id="db-sales" class="${TITLE}">{{ 'dashboard.sales.title' | translate }}</h2>
            @if (d.sales.data; as s) {
              <div class="grid grid-cols-2 gap-3">
                <div class="${TILE}"><p class="m-0 text-xs text-gray-500">{{ 'dashboard.sales.today' | translate }}</p><p class="${BIG}">{{ s.today.total | inr }}</p></div>
                <div class="${TILE}"><p class="m-0 text-xs text-gray-500">{{ 'dashboard.sales.session' | translate }}</p><p class="${BIG}">{{ s.session.total | inr }}</p></div>
              </div>
              <p class="m-0 mt-2 text-xs text-gray-500">{{ 'dashboard.sales.invoices' | translate }} {{ s.session.invoicesTotal | inr }} · {{ 'dashboard.sales.counter' | translate }} {{ s.session.counterTotal | inr }}</p>
              @if (line(); as points) {
                <svg class="mt-2 h-14 w-full" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" preserveAspectRatio="none" role="img" [attr.aria-label]="'dashboard.sales.line' | translate"><polyline [attr.points]="points" fill="none" stroke="currentColor" class="text-brand-600" stroke-width="2" vector-effect="non-scaling-stroke" /></svg>
              }
            } @else { <p class="m-0 text-sm text-red-600" role="alert">{{ 'dashboard.partFailed' | translate }}</p> }
          </section>

          @if (d.returns; as part) {
            <section class="${CARD}" aria-labelledby="db-ret">
              <h2 id="db-ret" class="${TITLE}">{{ 'dashboard.returns.title' | translate }}</h2>
              @if (part.data; as r) {
                <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.returns.creditNotes' | translate }} ({{ r.creditNotes }})</span><span class="font-mono">{{ r.creditNotesTotal | inr }}</span></div>
                <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.returns.refunds' | translate }} ({{ r.refunds }})</span><span class="font-mono">{{ r.refundsTotal | inr }}</span></div>
                <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.returns.vendorReturns' | translate }} ({{ r.vendorReturns }})</span><span class="font-mono">{{ r.vendorReturnsTotal | inr }}</span></div>
              } @else { <p class="m-0 text-sm text-red-600" role="alert">{{ 'dashboard.partFailed' | translate }}</p> }
            </section>
          }

          @if (d.owed; as part) {
            <section class="${CARD} md:col-span-2 xl:col-span-1" aria-labelledby="db-owed">
              <h2 id="db-owed" class="${TITLE}">{{ 'dashboard.owed.title' | translate }}</h2>
              @if (part.data; as w) {
                @for (g of groups(w); track g.key) {
                  <div class="mb-2">
                    <div class="${ROW}"><span class="font-medium">{{ 'dashboard.owed.' + g.key | translate }} ({{ g.group.count }})</span><span class="font-mono font-semibold">{{ g.group.total | inr }}</span></div>
                    @for (row of g.group.largest; track row.partyId) { <div class="flex justify-between text-xs text-gray-500"><span class="truncate">{{ row.name }}</span><span class="font-mono">{{ row.balance | inr }}</span></div> }
                  </div>
                }
              } @else { <p class="m-0 text-sm text-red-600" role="alert">{{ 'dashboard.partFailed' | translate }}</p> }
            </section>
          }

          <section class="${CARD}" aria-labelledby="db-stock">
            <h2 id="db-stock" class="${TITLE}">{{ 'dashboard.stock.title' | translate }}</h2>
            @if (d.stock.data; as k) {
              <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.stock.low' | translate }}</span><span class="font-mono font-semibold">{{ k.atOrBelowZero }}</span></div>
              <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.stock.negative' | translate }}</span><span class="font-mono">{{ k.belowZero }}</span></div>
              <div class="${ROW}"><span class="text-gray-500">{{ 'dashboard.stock.damaged' | translate }}</span><span class="font-mono">{{ k.damagedPieces }}</span></div>
              @if (k.value !== null) {
                <div class="${ROW} mt-1 border-t border-neutral-200 pt-2 dark:border-charcoal-700"><span>{{ 'dashboard.stock.value' | translate }}</span><span class="font-mono font-semibold">{{ k.value | inr }}</span></div>
                @if (k.itemsWithoutPrice) { <p class="m-0 text-xs text-gray-500">{{ k.itemsWithoutPrice }} {{ 'dashboard.stock.withoutPrice' | translate }}</p> }
              }
            } @else { <p class="m-0 text-sm text-red-600" role="alert">{{ 'dashboard.partFailed' | translate }}</p> }
          </section>
        </div>
      }
    </div>
  `,
})
export class DashboardPageComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly translate = inject(TranslateService);

  /** R2: the Payment button is the Owner's. */
  readonly isOwner = inject(AuthService).hasAppRole('OWNER');

  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly placeholders = [1, 2, 3, 4, 5, 6];
  private session: string | undefined;

  /** R8 (Q4): the day-wise sales as the points of a small line; nothing when there is no sale. */
  readonly line = computed(() => {
    const days = this.data()?.sales.data?.days ?? [];
    const max = Math.max(...days.map((d) => d.total), 0);
    if (days.length < 2 || max === 0) return null;
    return days.map((d, i) => `${(i / (days.length - 1)) * CHART_WIDTH},${CHART_HEIGHT - 4 - (d.total / max) * (CHART_HEIGHT - 8)}`).join(' ');
  });

  constructor() {
    this.load();
  }

  choose(session: string): void {
    this.session = session;
    this.load();
  }

  /** R9: the three groups of the owed card, in the order the owner reads them. */
  groups(w: { schoolsOwing: DashboardOwedGroup; schoolsInAdvance: DashboardOwedGroup; vendorsOwed: DashboardOwedGroup }): { key: string; group: DashboardOwedGroup }[] {
    return [
      { key: 'schoolsOwing', group: w.schoolsOwing },
      { key: 'schoolsInAdvance', group: w.schoolsInAdvance },
      { key: 'vendorsOwed', group: w.vendorsOwed },
    ];
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboard.get(this.session).subscribe({
      next: (d) => {
        this.loading.set(false);
        this.data.set(d);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }
}
