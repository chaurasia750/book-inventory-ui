import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { ItemService, PriceService, StockService, VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ITEM_CATEGORIES, ItemCategory, ItemSummary, VendorSummary } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

/** What the picker hands back: the ticked items and, when asked, one quantity and class for all of them. */
export interface BulkPick {
  items: ItemSummary[];
  quantity: number;
  className: string | null;
}

const PAGE = 100;
const LOOKUP = 200;
const FIELD = 'h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none';

/**
 * Sales spec R23 (and planning R2): pick many items at once. Filter by search, category, class and vendor, tick the rows, and
 * give one quantity and class for all (the order editor) or just the items (a class book list). Only active items are offered.
 */
@Component({
  selector: 'app-bulk-item-picker',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, TranslatePipe, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal size="wide" [open]="open()" [title]="'sales.bulk.title' | translate" (closed)="closed.emit()">
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <input type="search" [formControl]="search" autocomplete="off" [placeholder]="'sales.bulk.search' | translate" [attr.aria-label]="'sales.bulk.search' | translate" [class]="field + ' min-w-[10rem] flex-1'" />
          <select (change)="category.set($any($event.target).value || null); load()" [attr.aria-label]="'item.fields.category' | translate" [class]="field">
            <option value="">{{ 'item.filters.allCategories' | translate }}</option>
            @for (c of categories; track c) { <option [value]="c">{{ 'item.category.' + c | translate }}</option> }
          </select>
          <select (change)="classFilter.set($any($event.target).value || null); load()" [attr.aria-label]="'sales.columns2.className' | translate" [class]="field">
            <option value="">{{ 'sales.bulk.allClasses' | translate }}</option>
            @for (c of classes(); track c) { <option [value]="c">{{ c }}</option> }
          </select>
          <select (change)="vendor.set($any($event.target).value || null); load()" [attr.aria-label]="'item.fields.vendor' | translate" [class]="field">
            <option value="">{{ 'sales.bulk.allVendors' | translate }}</option>
            @for (v of vendors(); track v.id) { <option [value]="v.id">{{ v.name }}</option> }
          </select>
        </div>
        @if (error()) { <p class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
        <div class="max-h-96 overflow-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2"><input type="checkbox" [checked]="allChecked()" (change)="toggleAll($any($event.target).checked)" [attr.aria-label]="'sales.bulk.selected' | translate: { n: items().length }" class="h-4 w-4" /></th>
                <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'item.columns.category' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'item.columns.className' | translate }}</th>
                <th class="px-3 py-2 font-semibold">{{ 'item.columns.vendor' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'item.fields.gstRate' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.columns.rate' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'sales.entry.stock' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-charcoal-700">
              @for (it of items(); track it.id) {
                <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700" (click)="toggle(it.id)">
                  <td class="px-3 py-1.5"><input type="checkbox" [checked]="ticked().has(it.id)" (click)="$event.stopPropagation()" (change)="toggle(it.id)" [attr.aria-label]="it.name" class="h-4 w-4" /></td>
                  <td class="px-3 py-1.5"><span class="font-medium text-primary-fg">{{ it.name }}</span> <span class="font-mono text-gray-500">{{ it.code }}</span></td>
                  <td class="px-3 py-1.5 text-gray-600">{{ 'item.category.' + it.category | translate }}</td>
                  <td class="px-3 py-1.5 text-gray-600">{{ it.className || '-' }}</td>
                  <td class="px-3 py-1.5 text-gray-600">{{ it.vendorName || '-' }}</td>
                  <td class="px-3 py-1.5 text-right font-mono text-gray-600">{{ it.gstRatePercent }}%</td>
                  <td class="px-3 py-1.5 text-right font-mono">{{ rateOf(it.id) === null ? '-' : (rateOf(it.id) | number: '1.2-2') }}</td>
                  <td class="px-3 py-1.5 text-right font-mono" [class.text-red-600]="stockOf(it) !== null && stockOf(it)! <= 0">{{ stockOf(it) ?? '-' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="py-6 text-center text-sm text-gray-400">{{ 'sales.bulk.empty' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        @if (total() > items().length) { <p class="m-0 text-xs text-gray-500">{{ 'sales.bulk.more' | translate: { n: items().length } }}</p> }
        <div class="flex flex-wrap items-end justify-between gap-3">
          @if (askQuantity()) {
            <div class="flex flex-wrap gap-3">
              <label class="text-xs text-gray-500">{{ 'sales.bulk.qty' | translate }}<span class="text-red-500" aria-hidden="true"> *</span>
                <input type="number" min="1" step="1" [value]="quantity()" (change)="quantity.set(+$any($event.target).value)" class="mt-1 block h-10 w-24 rounded-lg border border-gray-300 px-2 text-right text-sm" />
              </label>
              <label class="text-xs text-gray-500">{{ 'sales.bulk.className' | translate }}
                <select [value]="className() ?? ''" (change)="className.set($any($event.target).value || null)" [class]="field + ' mt-1 block'">
                  <option value="" [selected]="!className()">{{ 'sales.bulk.noClass' | translate }}</option>
                  @for (c of classes(); track c) { <option [value]="c" [selected]="c === className()">{{ c }}</option> }
                </select>
              </label>
            </div>
          } @else { <span></span> }
          <div class="flex gap-2">
            <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
            <app-button [disabled]="ticked().size === 0 || (askQuantity() && quantity() < 1)" (clicked)="confirm()">
              {{ (askQuantity() ? 'sales.bulk.add' : 'sales.bulk.pick') | translate: { n: ticked().size } }}
            </app-button>
          </div>
        </div>
      </div>
    </app-modal>
  `,
})
export class BulkItemPickerComponent {
  readonly open = input(false);
  /** The school's classes, for the class filter and the class of the added lines. */
  readonly classes = input<string[]>([]);
  /** True for an order (one quantity and class for all); false to pick items only. */
  readonly askQuantity = input(true);
  readonly closed = output<void>();
  readonly picked = output<BulkPick>();

  private readonly itemService = inject(ItemService);
  private readonly vendorService = inject(VendorService);
  private readonly priceService = inject(PriceService);
  private readonly stockService = inject(StockService);
  private readonly translate = inject(TranslateService);

  readonly field = FIELD;
  readonly categories = ITEM_CATEGORIES;
  readonly search = new FormControl('', { nonNullable: true });
  readonly category = signal<ItemCategory | null>(null);
  readonly classFilter = signal<string | null>(null);
  readonly vendor = signal<string | null>(null);
  readonly vendors = signal<VendorSummary[]>([]);
  readonly items = signal<ItemSummary[]>([]);
  readonly total = signal(0);
  private readonly rates = signal(new Map<string, number | null>());
  private readonly stocks = signal(new Map<string, number>());
  readonly ticked = signal(new Set<string>());
  readonly quantity = signal(1);
  readonly className = signal<string | null>(null);
  readonly error = signal('');
  readonly allChecked = computed(() => this.items().length > 0 && this.items().every((i) => this.ticked().has(i.id)));

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => {
          this.ticked.set(new Set());
          this.load();
        });
      }
    });
    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.load());
    this.vendorService.list({ pageIndex: 1, pageSize: 200 }).subscribe({ next: (p) => this.vendors.set(p.items), error: () => this.vendors.set([]) });
  }

  load(): void {
    this.error.set('');
    const filter = {
      search: this.search.value.trim() || undefined, category: this.category() ?? undefined, className: this.classFilter() ?? undefined,
      vendorId: this.vendor() ?? undefined, pageIndex: 1,
    };
    forkJoin({
      items: this.itemService.list({ ...filter, status: 'ACTIVE', orderBy: 'name', pageSize: PAGE }),
      prices: this.priceService.list({ ...filter, pageSize: LOOKUP }).pipe(catchError(() => of(null))),
      stock: this.stockService.list({ ...filter, pageSize: LOOKUP }).pipe(catchError(() => of(null))),
    }).subscribe({
        next: ({ items: p, prices, stock }) => {
          this.rates.set(new Map(prices?.items.map((r) => [r.itemId, r.defaultVersion?.saleAmount ?? null])));
          this.stocks.set(new Map(stock?.items.map((s) => [s.itemId, s.mainQuantity])));
          this.items.set(p.items);
          this.total.set(p.totalCount);
        },
        error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
      });
  }

  /** The default sale price of an item, or `null` when it has none. */
  rateOf(id: string): number | null {
    return this.rates().get(id) ?? null;
  }

  /** The Main stock of an item, or `null` when its quantity is not tracked or unknown. */
  stockOf(item: ItemSummary): number | null {
    return item.isStockManaged ? (this.stocks().get(item.id) ?? null) : null;
  }

  toggle(id: string): void {
    this.ticked.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  toggleAll(on: boolean): void {
    this.ticked.update((set) => {
      const next = new Set(set);
      for (const it of this.items()) {
        if (on) {
          next.add(it.id);
        } else {
          next.delete(it.id);
        }
      }
      return next;
    });
  }

  confirm(): void {
    const chosen = this.items().filter((i) => this.ticked().has(i.id));
    this.picked.emit({ items: chosen, quantity: this.quantity(), className: this.className() });
  }
}
