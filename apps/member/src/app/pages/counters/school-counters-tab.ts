import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Counter, CounterBillSummary } from '@org/shared-models';
import { counterStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, SkeletonLoaderComponent } from '@org/ui';
import { IndianCurrencyPipe } from './indian-currency.pipe';

const SHOWN = 20;

/**
 * The Counters tab of a school's profile (sales spec R38, R49, platform U16): the school's counters and its latest counter bills,
 * newest first. A row opens the counter or the bill beside its own list; the Owner and Staff both see it (R48).
 */
@Component({
  selector: 'app-school-counters-tab',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, ButtonComponent, SkeletonLoaderComponent, IndianCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      @if (error()) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          <span>{{ error() }}</span><app-button size="sm" variant="secondary" (clicked)="load()">{{ 'users.retry' | translate }}</app-button>
        </div>
      }
      <section>
        <h3 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'counter.title' | translate }}</h3>
        <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'counter.columns.name' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'counter.columns.session' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'counter.columns.startDate' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'counter.columns.status' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @if (loading()) { <tr><td colspan="4" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr> }
              @else {
                @for (c of counters(); track c.id) {
                  <tr>
                    <td class="px-3 py-2"><a [routerLink]="['/counters', c.id]" class="font-medium text-brand-700 hover:underline">{{ c.name }}</a></td>
                    <td class="px-3 py-2 font-mono">{{ c.session }}</td>
                    <td class="whitespace-nowrap px-3 py-2">{{ c.startDate | date: 'dd MMM yy' }}</td>
                    <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-[11px] font-medium" [class]="counterClass(c.status)">{{ 'counter.status.' + c.status | translate }}</span></td>
                  </tr>
                } @empty { <tr><td colspan="4" class="py-6 text-center text-gray-400">{{ 'counter.empty' | translate }}</td></tr> }
              }
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 class="m-0 mb-2 text-sm font-semibold text-primary-fg">{{ 'counter.bills.title' | translate }}</h3>
        <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'counter.bill.number' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'counter.bill.student' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'counter.bill.date' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.totals.grandTotal' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
              @if (loading()) { <tr><td colspan="4" class="px-3 py-3"><app-skeleton-loader width="100%" /></td></tr> }
              @else {
                @for (b of bills(); track b.id) {
                  <tr>
                    <td class="px-3 py-2"><a [routerLink]="['/counters', 'bills', b.id]" class="font-mono font-medium text-brand-700 hover:underline">{{ b.number }}</a></td>
                    <td class="px-3 py-2">{{ b.studentName }} <span class="text-gray-500">{{ b.className }}</span></td>
                    <td class="whitespace-nowrap px-3 py-2">{{ b.billDate | date: 'dd MMM yy' }}</td>
                    <td class="px-3 py-2 text-right font-mono" [class.line-through]="b.status === 'CANCELLED'">{{ b.grandTotal | inr }}</td>
                  </tr>
                } @empty { <tr><td colspan="4" class="py-6 text-center text-gray-400">{{ 'counter.bills.empty' | translate }}</td></tr> }
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class SchoolCountersTabComponent {
  readonly schoolId = input.required<string>();

  private readonly service = inject(CounterService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly counters = signal<Counter[]>([]);
  readonly bills = signal<CounterBillSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  counterClass = counterStatusBadgeClass;

  constructor() {
    queueMicrotask(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      counters: this.service.list({ schoolId: this.schoolId(), orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: SHOWN }),
      bills: this.service.bills({ schoolId: this.schoolId(), orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: SHOWN }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ counters, bills }) => {
          this.loading.set(false);
          this.counters.set(counters.items);
          this.bills.set(bills.items);
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(messageForError(e, this.translate));
        },
      });
  }
}
