import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CustomerService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CUSTOMER_STATUSES, CustomerStatus, CustomerSummary, PagedList } from '@org/shared-models';
import { customerStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, SchoolSelectComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { CustomerAddComponent } from './customer-add';
import { CustomerDetailComponent } from './customer-detail';
import { CustomerEditComponent } from './customer-edit';

const PAGE_SIZE = 20;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The list of the company's customers (customer spec R9, R11): search by name, code and mobile, filters by status and school,
 * paging. A customer, the form for a new one and the edit form open in the panel beside the list (platform U10). The Owner and
 * Staff reach it (the route is guarded); Staff cannot edit (the detail hides the buttons, the API refuses them).
 */
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    SchoolSelectComponent,
    ListDetailComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    CustomerAddComponent,
    CustomerDetailComponent,
    CustomerEditComponent,
  ],
  templateUrl: './customer-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListComponent {
  private readonly customers = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Platform U10: what the panel beside the list shows (child routes `new`, `:id`, `:id/edit`), or nothing. */
  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly select = SELECT;
  readonly statuses = CUSTOMER_STATUSES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<CustomerStatus | ''>('');
  readonly schoolId = signal('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<CustomerSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

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
    this.status.set(value as CustomerStatus | '');
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

  statusClass(status: CustomerStatus): string {
    return customerStatusBadgeClass(status);
  }

  openAdd(): void {
    void this.router.navigate(['/customers', 'new']);
  }

  openView(id: string): void {
    void this.router.navigate(['/customers', id]);
  }

  openEdit(id: string): void {
    void this.router.navigate(['/customers', id, 'edit']);
  }

  closePanel(): void {
    void this.router.navigate(['/customers']);
  }

  openCreated(id: string): void {
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
    this.customers
      .list({
        search: this.search.value.trim() || undefined,
        status: this.status() || undefined,
        schoolId: this.schoolId() || undefined,
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
