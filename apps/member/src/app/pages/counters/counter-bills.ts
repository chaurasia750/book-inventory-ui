import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CounterService, SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { COUNTER_BILL_STATUSES, Counter, CounterBillStatus, CounterBillSummary, PagedList, SchoolSummary } from '@org/shared-models';
import { counterBillStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, DatePickerComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { CounterBillDetailComponent } from './counter-bill-detail';

const PAGE_SIZE = 20;
const CHOICES = 200;
const SELECT = 'h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The company's counter bills (sales spec R47, R49): search by number and student name, filters by counter, school, class, status and
 * date range, paging, newest first. A bill opens in the panel beside the list (platform U10) with the Owner's Cancel. A student's
 * bills are listed together through the `studentId` query filter the bill's panel sets. The Owner and Staff reach it (the route is
 * guarded); only the Owner cancels (R48).
 */
@Component({
  selector: 'app-counter-bills',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, CounterBillDetailComponent],
  templateUrl: './counter-bills.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterBillsComponent {
  private readonly counters = inject(CounterService);
  private readonly schoolService = inject(SchoolService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly select = SELECT;
  readonly statuses = COUNTER_BILL_STATUSES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly from = new FormControl('', { nonNullable: true });
  readonly to = new FormControl('', { nonNullable: true });
  readonly className = signal('');
  readonly status = signal<CounterBillStatus | ''>('');
  readonly counterId = signal('');
  readonly schoolId = signal('');
  readonly studentId = signal(this.route.snapshot.queryParamMap.get('studentId') ?? '');

  readonly countersList = signal<Counter[]>([]);
  readonly schools = signal<SchoolSummary[]>([]);
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<CounterBillSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor() {
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyFilters());
    this.from.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyFilters());
    this.to.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyFilters());
    // The bill's panel sets the `studentId` filter; a new value reloads the list (R49).
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('studentId') ?? '';
      if (id !== this.studentId()) {
        this.studentId.set(id);
        this.applyFilters();
      }
    });
    this.counters.list({ orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: CHOICES }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (p) => this.countersList.set(p.items), error: () => this.countersList.set([]) });
    this.schoolService.list({ orderBy: 'Name ASC', pageIndex: 1, pageSize: CHOICES }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (p) => this.schools.set(p.items), error: () => this.schools.set([]) });
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  setStatus(value: string): void {
    this.status.set(value as CounterBillStatus | '');
    this.applyFilters();
  }

  setCounter(value: string): void {
    this.counterId.set(value);
    this.applyFilters();
  }

  setSchool(value: string): void {
    this.schoolId.set(value);
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  statusClass(status: CounterBillStatus): string {
    return counterBillStatusBadgeClass(status);
  }

  clearStudent(): void {
    void this.router.navigate(['/counters', 'bills']);
  }

  openView(id: string): void {
    void this.router.navigate(['/counters', 'bills', id]);
  }

  closePanel(): void {
    void this.router.navigate(['/counters', 'bills']);
  }

  /** R49: a student's bills list together. */
  showStudentBills(studentId: string): void {
    void this.router.navigate(['/counters', 'bills'], { queryParams: { studentId } });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.counters
      .bills({
        search: this.search.value.trim() || undefined,
        counterId: this.counterId() || undefined,
        schoolId: this.schoolId() || undefined,
        className: this.className().trim() || undefined,
        studentId: this.studentId() || undefined,
        status: this.status() || undefined,
        from: this.from.value || undefined,
        to: this.to.value || undefined,
        orderBy: 'CreatedAt DESC',
        pageIndex: this.page(),
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          this.result.set(result);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadError.set(messageForError(error, this.translate));
        },
      });
  }
}
