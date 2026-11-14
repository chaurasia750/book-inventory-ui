import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '@org/auth';
import { PriceService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ITEM_CATEGORIES, ItemCategory, PagedList, PriceListRow } from '@org/shared-models';
import { ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectSelectedId } from '@org/ui';
import { PriceCopyComponent } from './price-copy';
import { PriceVersionsComponent } from './price-versions';

const PAGE_SIZE = 20;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The price list (price spec R9): one row per item with its default version, searchable by item name, code, barcode, class,
 * subject and vendor, filtered by category, paged. An item's versions open in the panel beside the list (platform U10). The
 * Owner also gets Copy version and Bulk change; Staff see the list read-only and no purchase prices (the API sends none).
 */
@Component({
  selector: 'app-price-list',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonComponent,
    ListDetailComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    PriceVersionsComponent,
    PriceCopyComponent,
  ],
  templateUrl: './price-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceListComponent {
  private readonly prices = inject(PriceService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** R6: only the Owner copies and changes prices in bulk. */
  readonly canEdit = inject(AuthService).hasAppRole('OWNER');

  /** Platform U10: the item whose prices are open beside the list (child route `:id`), or null. */
  readonly selectedId = injectSelectedId();
  readonly hasPanel = computed(() => this.selectedId() !== null);

  readonly select = SELECT;
  readonly categories = ITEM_CATEGORIES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly category = signal<ItemCategory | ''>('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<PriceListRow> | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly skeletonRows = [1, 2, 3];

  readonly copyOpen = signal(false);

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

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openItem(id: string): void {
    void this.router.navigate(['/prices', id]);
  }

  closePanel(): void {
    void this.router.navigate(['/prices']);
  }

  /** R10: the bulk change is a page of its own (the Owner's only; the route guards it). */
  openBulk(): void {
    void this.router.navigate(['/prices', 'bulk']);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.prices
      .list({
        search: this.search.value.trim() || undefined,
        category: this.category() || undefined,
        orderBy: 'ItemName ASC',
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
