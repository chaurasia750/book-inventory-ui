import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { Counter, CounterDaySummary } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent, SkeletonLoaderComponent } from '@org/ui';
import { MoneyPipe } from './money.pipe';

const CHOICES = 200;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The counter day summary (sales spec R50, AC42): the bills, total, Cash, UPI, books and quantity of one date for one counter or,
 * without a counter, the whole company. Cancelled bills are left out (R47). It is read-only: the date is picked (today, the business
 * time zone, by default) and the counter is optional. The Owner and Staff reach it (the route is guarded).
 */
@Component({
  selector: 'app-counter-day-summary',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, SkeletonLoaderComponent, MoneyPipe],
  templateUrl: './counter-day-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterDaySummaryComponent {
  private readonly counters = inject(CounterService);
  private readonly translate = inject(TranslateService);

  readonly select = SELECT;
  readonly tiles = [1, 2, 3, 4, 5, 6];
  readonly date = new FormControl(businessToday(), { nonNullable: true });
  readonly counterId = signal('');

  readonly countersList = signal<Counter[]>([]);
  readonly summary = signal<CounterDaySummary | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');

  constructor() {
    this.date.valueChanges.subscribe(() => this.load());
    this.counters.list({ orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: CHOICES }).subscribe({ next: (p) => this.countersList.set(p.items), error: () => this.countersList.set([]) });
    this.load();
  }

  setCounter(value: string): void {
    this.counterId.set(value);
    this.load();
  }

  load(): void {
    const date = this.date.value;
    if (!date) return;
    this.loading.set(true);
    this.loadError.set('');
    this.counters.daySummary(date, this.counterId() || undefined).subscribe({
      next: (summary) => {
        this.loading.set(false);
        this.summary.set(summary);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.loadError.set(messageForError(e, this.translate));
      },
    });
  }
}

/** R50: the day summary defaults to today in the business time zone (the API's Asia/Kolkata, `yyyy-MM-dd`). */
function businessToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}
