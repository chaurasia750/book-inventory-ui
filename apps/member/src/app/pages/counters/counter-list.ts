import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '@org/auth';
import { CounterService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { COUNTER_STATUSES, Counter, CounterStatus, PagedList } from '@org/shared-models';
import { counterStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, SchoolSelectComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { CounterAddComponent } from './counter-add';
import { CounterDetailComponent } from './counter-detail';
import { CounterEditComponent } from './counter-edit';

const PAGE_SIZE = 20;
const SESSION_SCAN = 200;
const SELECT = 'h-10 max-w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The list of the company's counters (sales spec R38, R39, R49): search by name and school, filters by school, session and status,
 * paging, newest first. A counter, the form for a new one and the edit form open in the panel beside the list (platform U10). The
 * Owner and Staff reach it (the route is guarded); only the Owner adds, edits, closes and opens (R48).
 */
@Component({
  selector: 'app-counter-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    SchoolSelectComponent,
    ListDetailComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    CounterAddComponent,
    CounterDetailComponent,
    CounterEditComponent,
  ],
  templateUrl: './counter-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterListComponent {
  private readonly counters = inject(CounterService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Sales R48: only the Owner adds, edits, closes and opens a counter. */
  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  /** Platform U10: what the panel beside the list shows (child routes `new`, `:id`, `:id/edit`), or nothing. */
  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly select = SELECT;
  readonly statuses = COUNTER_STATUSES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly sessionFilter = signal('');
  readonly sessions = signal<string[]>([]);
  readonly status = signal<CounterStatus | ''>('');
  readonly schoolId = signal('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<Counter> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.loadSessions();
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  setSession(value: string): void {
    this.sessionFilter.set(value);
    this.applyFilters();
  }

  /** The drop-down offers the sessions the company's counters have, newest first. */
  private loadSessions(): void {
    this.counters
      .list({ orderBy: 'CreatedAt DESC', pageIndex: 1, pageSize: SESSION_SCAN })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.sessions.set([...new Set(page.items.map((c) => c.session))].sort().reverse()),
        error: () => this.sessions.set([]),
      });
  }

  setStatus(value: string): void {
    this.status.set(value as CounterStatus | '');
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

  statusClass(status: CounterStatus): string {
    return counterStatusBadgeClass(status);
  }

  openAdd(): void {
    void this.router.navigate(['/counters', 'new']);
  }

  openView(id: string): void {
    void this.router.navigate(['/counters', id]);
  }

  openEdit(id: string): void {
    void this.router.navigate(['/counters', id, 'edit']);
  }

  openBilling(id: string): void {
    void this.router.navigate(['/counters', id, 'bill']);
  }

  closePanel(): void {
    void this.router.navigate(['/counters']);
  }

  openCreated(id: string): void {
    this.loadSessions();
    this.load();
    this.openView(id);
  }

  afterEdit(id: string): void {
    this.load();
    this.openView(id);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.counters
      .list({
        search: this.search.value.trim() || undefined,
        session: this.sessionFilter() || undefined,
        status: this.status() || undefined,
        schoolId: this.schoolId() || undefined,
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
