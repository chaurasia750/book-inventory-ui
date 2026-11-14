import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { PagedList, VENDOR_STATES, VENDOR_STATUSES, VendorStatus, VendorSummary } from '@org/shared-models';
import { vendorStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { VendorAddComponent } from './vendor-add';
import { VendorDetailComponent } from './vendor-detail';
import { VendorEditComponent } from './vendor-edit';

const PAGE_SIZE = 20;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The list of the company's vendors (vendor spec R8, R10): search by name, code, contact person, mobile and GSTIN, filters by
 * status and state, paging. A vendor, the form for a new one and the edit form open in the panel beside the list (platform
 * U10). Only the Owner reaches it (the route is guarded and the menu entry is the Owner's); the company is the session's.
 */
@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    ListDetailComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    VendorAddComponent,
    VendorDetailComponent,
    VendorEditComponent,
  ],
  templateUrl: './vendor-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorListComponent {
  private readonly vendors = inject(VendorService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Platform U10: what the panel beside the list shows (child routes `new`, `:id`, `:id/edit`), or nothing. */
  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly select = SELECT;
  readonly statuses = VENDOR_STATUSES;
  readonly states = VENDOR_STATES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<VendorStatus | ''>('');
  readonly state = signal('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<VendorSummary> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3];

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
    this.status.set(value as VendorStatus | '');
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

  statusClass(status: VendorStatus): string {
    return vendorStatusBadgeClass(status);
  }

  openAdd(): void {
    void this.router.navigate(['/vendors', 'new']);
  }

  openView(id: string): void {
    void this.router.navigate(['/vendors', id]);
  }

  openEdit(id: string): void {
    void this.router.navigate(['/vendors', id, 'edit']);
  }

  closePanel(): void {
    void this.router.navigate(['/vendors']);
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
    this.vendors
      .list({
        search: this.search.value.trim() || undefined,
        status: this.status() || undefined,
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
