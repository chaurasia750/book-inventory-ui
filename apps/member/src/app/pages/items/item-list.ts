import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '@org/auth';
import { ItemService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ITEM_CATEGORIES, ITEM_STATUSES, ItemCategory, ItemStatus, ItemSummary, PagedList } from '@org/shared-models';
import { itemStatusBadgeClass } from '@org/shared-utils';
import { ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectPanelState } from '@org/ui';
import { ItemAddComponent } from './item-add';
import { ItemDetailComponent } from './item-detail';
import { ItemEditComponent } from './item-edit';
import { ItemImportComponent } from './item-import';

const PAGE_SIZE = 20;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The list of the company's items (item spec R9, R12): search by name, code, barcode, class, subject and vendor name, filters
 * by category, stock managed and (for the Owner) status, paging. An item, the form for a new one and the edit form open in the
 * panel beside the list (platform U10). Staff get the list read-only (the API shows them active items only).
 */
@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    ListDetailComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    ItemAddComponent,
    ItemDetailComponent,
    ItemEditComponent,
    ItemImportComponent,
  ],
  templateUrl: './item-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent {
  private readonly items = inject(ItemService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** R9: only the Owner adds items; Staff read. */
  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  /** Platform U10: what the panel beside the list shows (child routes `new`, `:id`, `:id/edit`), or nothing. */
  readonly panel = injectPanelState();
  readonly selectedId = computed(() => this.panel().id);
  readonly hasPanel = computed(() => this.panel().mode !== null);

  readonly importOpen = signal(false);
  readonly select = SELECT;
  readonly categories = ITEM_CATEGORIES;
  readonly statuses = ITEM_STATUSES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly category = signal<ItemCategory | ''>('');
  readonly status = signal<ItemStatus | ''>('');
  readonly stock = signal<'' | 'true' | 'false'>('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<ItemSummary> | null>(null);
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

  setCategory(value: string): void {
    this.category.set(value as ItemCategory | '');
    this.applyFilters();
  }

  setStatus(value: string): void {
    this.status.set(value as ItemStatus | '');
    this.applyFilters();
  }

  setStock(value: string): void {
    this.stock.set(value as '' | 'true' | 'false');
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  statusClass(status: ItemStatus): string {
    return itemStatusBadgeClass(status);
  }

  openAdd(): void {
    void this.router.navigate(['/items', 'new']);
  }

  openView(id: string): void {
    void this.router.navigate(['/items', id]);
  }

  openEdit(id: string): void {
    void this.router.navigate(['/items', id, 'edit']);
  }

  closePanel(): void {
    void this.router.navigate(['/items']);
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
    this.items
      .list({
        search: this.search.value.trim() || undefined,
        category: this.category() || undefined,
        status: this.status() || undefined,
        isStockManaged: this.stock() === '' ? undefined : this.stock() === 'true',
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
