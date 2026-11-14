import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '@org/auth';
import { SchoolService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import {
  PagedList,
  SALE_TYPES,
  SCHOOL_STATES,
  SCHOOL_STATUSES,
  SESSION_TYPES,
  SaleType,
  SchoolFields,
  SchoolStatus,
  SchoolSummary,
  SessionType,
} from '@org/shared-models';
import { schoolStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, ListDetailComponent, ModalComponent, PaginationComponent, SkeletonLoaderComponent, injectSelectedId } from '@org/ui';
import { SchoolDetailComponent } from './school-detail';
import { SchoolFormComponent } from './school-form';

const PAGE_SIZE = 20;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The list of the company's schools (school spec R9, R11): search by name, code, contact person and mobile, filters by
 * status, sale type, session type and state, paging, and for the Owner the add dialog. Staff get the same list read-only
 * (the API shows them active schools only). The company is the session's; nothing here can ask for another company's.
 */
@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    ListDetailComponent,
    ModalComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    SchoolFormComponent,
    SchoolDetailComponent,
  ],
  templateUrl: './school-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolListComponent {
  private readonly schools = inject(SchoolService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** R9: only the Owner adds schools; Staff read. */
  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  /** Platform U10: the school open beside the list (child route `:id`), or null. */
  readonly selectedId = injectSelectedId();
  readonly hasPanel = computed(() => this.selectedId() !== null);

  readonly select = SELECT;
  readonly statuses = SCHOOL_STATUSES;
  readonly saleTypes = SALE_TYPES;
  readonly sessionTypes = SESSION_TYPES;
  readonly states = SCHOOL_STATES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<SchoolStatus | ''>('');
  readonly saleType = signal<SaleType | ''>('');
  readonly sessionType = signal<SessionType | ''>('');
  readonly state = signal('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<SchoolSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3];

  readonly addOpen = signal(false);
  readonly adding = signal(false);
  readonly addError = signal('');

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  setStatus(value: string): void {
    this.status.set(value as SchoolStatus | '');
    this.applyFilters();
  }

  setSaleType(value: string): void {
    this.saleType.set(value as SaleType | '');
    this.applyFilters();
  }

  setSessionType(value: string): void {
    this.sessionType.set(value as SessionType | '');
    this.applyFilters();
  }

  setState(value: string): void {
    this.state.set(value);
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  open(school: SchoolSummary): void {
    void this.router.navigate(['/schools', school.id]);
  }

  closePanel(): void {
    void this.router.navigate(['/schools']);
  }

  statusClass(status: SchoolStatus): string {
    return schoolStatusBadgeClass(status);
  }

  openAdd(): void {
    this.addError.set('');
    this.addOpen.set(true);
  }

  add(fields: SchoolFields): void {
    this.adding.set(true);
    this.addError.set('');
    this.schools.create(fields).subscribe({
      next: (created) => {
        this.adding.set(false);
        this.addOpen.set(false);
        void this.router.navigate(['/schools', created.id]);
      },
      error: (error: unknown) => {
        this.adding.set(false);
        this.addError.set(messageForError(error, this.translate));
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.schools
      .list({
        search: this.search.value.trim() || undefined,
        status: this.status() || undefined,
        saleType: this.saleType() || undefined,
        sessionType: this.sessionType() || undefined,
        state: this.state() || undefined,
        orderBy: 'Name ASC',
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
