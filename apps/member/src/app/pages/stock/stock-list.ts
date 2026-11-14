import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StockService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ITEM_CATEGORIES, ItemCategory, PagedList, StockListRow } from '@org/shared-models';
import { ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, injectSelectedId } from '@org/ui';
import { ItemStockComponent } from './item-stock';

const PAGE_SIZE = 20;
const SELECT = 'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The stock list (stock spec R9, R10, R16): one row per stock-managed item with its Main, Damaged and Sample quantities and a
 * warning mark at zero or below; searchable, filtered by category, "zero or below only" and "show inactive", sortable by name or
 * code, paged. An item's stock opens in the panel beside the list (platform U10).
 */
@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, ListDetailComponent, PaginationComponent, SkeletonLoaderComponent, ItemStockComponent],
  templateUrl: './stock-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListComponent {
  private readonly stock = inject(StockService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedId = injectSelectedId();
  readonly hasPanel = computed(() => this.selectedId() !== null);

  readonly select = SELECT;
  readonly categories = ITEM_CATEGORIES;

  readonly search = new FormControl('', { nonNullable: true });
  readonly category = signal<ItemCategory | ''>('');
  readonly lowOnly = signal(false);
  readonly includeInactive = signal(false);
  readonly orderBy = signal('ItemName ASC');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly result = signal<PagedList<StockListRow> | null>(null);
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

  setLowOnly(value: boolean): void {
    this.lowOnly.set(value);
    this.applyFilters();
  }

  setIncludeInactive(value: boolean): void {
    this.includeInactive.set(value);
    this.applyFilters();
  }

  setOrder(value: string): void {
    this.orderBy.set(value);
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openItem(id: string): void {
    void this.router.navigate(['/stock', id]);
  }

  closePanel(): void {
    void this.router.navigate(['/stock']);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.stock
      .list({
        search: this.search.value.trim() || undefined,
        category: this.category() || undefined,
        atOrBelowZeroOnly: this.lowOnly() || undefined,
        includeInactive: this.includeInactive() || undefined,
        orderBy: this.orderBy(),
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
