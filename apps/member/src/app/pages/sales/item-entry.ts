import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, of } from 'rxjs';
import { ItemService, PriceService, StockService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ItemSummary } from '@org/shared-models';

/** One suggestion: the item with its default sale price and Main stock (either is `null` when unknown or not tracked). */
export interface ItemSuggestion {
  item: ItemSummary;
  saleAmount: number | null;
  stockQuantity: number | null;
}

const MAX_SUGGESTIONS = 8;
const LOOKUP_SIZE = 200;
const PAUSE_MS = 250;

/**
 * The line entry of the order editor (sales spec R4): an autocomplete. Type a name, code or barcode and the matching books are
 * listed with their default sale price and Main stock; pick one with the mouse, or with the arrow keys and Enter. Enter on no
 * highlighted row adds a single or exact match at once (a scan keeps the focus for the next one); none shows "item not found".
 */
@Component({
  selector: 'app-item-entry',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <label for="oe-scan" class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'sales.editor.addItem' | translate }}</label>
      <input #box id="oe-scan" type="search" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="oe-suggestions" [attr.aria-expanded]="suggestions().length > 0"
        [placeholder]="'sales.editor.scanHint' | translate"
        (input)="suggest(box.value)" (keydown.arrowdown)="move(1); $event.preventDefault()" (keydown.arrowup)="move(-1); $event.preventDefault()"
        (keydown.enter)="enter(box.value); $event.preventDefault()" (keydown.escape)="close()"
        class="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
      @if (message()) {
        <p class="mt-1 text-xs text-red-600" role="alert">{{ message() }}</p>
      }
      @if (suggestions().length > 0) {
        <ul id="oe-suggestions" role="listbox" class="absolute z-20 mt-1 max-h-96 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
          <li class="grid grid-cols-[1fr_6rem_6rem] gap-3 border-b border-neutral-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500 dark:border-charcoal-700" aria-hidden="true">
            <span>{{ 'sales.columns.item' | translate }}</span>
            <span class="text-right">{{ 'sales.columns.rate' | translate }}</span>
            <span class="text-right">{{ 'sales.entry.stock' | translate }}</span>
          </li>
          @for (s of suggestions(); track s.item.id; let i = $index) {
            <li role="option" [attr.aria-selected]="i === active()">
              <button type="button" (click)="pick(s.item)" (mouseenter)="active.set(i)"
                class="grid w-full grid-cols-[1fr_6rem_6rem] items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-charcoal-700"
                [class.bg-neutral-100]="i === active()">
                <span class="min-w-0">
                  <span class="block truncate font-medium">{{ s.item.name }}</span>
                  <span class="font-mono text-xs text-gray-500">{{ s.item.code }}@if (s.item.className) { · {{ s.item.className }} }</span>
                </span>
                <span class="text-right font-mono">{{ s.saleAmount === null ? '-' : (s.saleAmount | number: '1.2-2') }}</span>
                <span class="text-right font-mono" [class.text-red-600]="s.stockQuantity !== null && s.stockQuantity <= 0">{{ s.stockQuantity === null ? '-' : s.stockQuantity }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ItemEntryComponent {
  readonly picked = output<ItemSummary>();

  private readonly items = inject(ItemService);
  private readonly prices = inject(PriceService);
  private readonly stock = inject(StockService);
  private readonly translate = inject(TranslateService);
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly suggestions = signal<ItemSuggestion[]>([]);
  readonly active = signal(-1);
  readonly message = signal('');

  /** Lists the matches while typing (after a short pause, from two characters); nothing is added until one is picked or Enter is pressed. */
  suggest(text: string): void {
    clearTimeout(this.timer);
    this.message.set('');
    const search = text.trim();
    if (search.length < 2) {
      this.close();
      return;
    }

    this.timer = setTimeout(() => this.load(search), PAUSE_MS);
  }

  /** Arrow keys move the highlighted row. */
  move(step: number): void {
    const count = this.suggestions().length;
    if (count > 0) {
      this.active.set((this.active() + step + count) % count);
    }
  }

  /** Enter picks the highlighted row, else adds a single or exact match, else lists the matches. */
  enter(text: string): void {
    const highlighted = this.suggestions()[this.active()];
    if (highlighted) {
      this.pick(highlighted.item);
      return;
    }

    clearTimeout(this.timer);
    const search = text.trim();
    this.message.set('');
    if (search) {
      this.load(search, true);
    }
  }

  pick(item: ItemSummary): void {
    this.close();
    this.picked.emit(item);
    const box = this.box().nativeElement;
    box.value = '';
    box.focus();
  }

  close(): void {
    this.suggestions.set([]);
    this.active.set(-1);
  }

  private load(search: string, addSingle = false): void {
    const params = { search, pageIndex: 1 };
    forkJoin({
      items: this.items.list({ ...params, status: 'ACTIVE', orderBy: 'Name ASC', pageSize: MAX_SUGGESTIONS }),
      prices: this.prices.list({ ...params, pageSize: LOOKUP_SIZE }).pipe(catchError(() => of(null))),
      stock: this.stock.list({ ...params, pageSize: LOOKUP_SIZE }).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ items, prices, stock }) => {
        if (this.box().nativeElement.value.trim() !== search) {
          return;
        }

        const rate = new Map(prices?.items.map((p) => [p.itemId, p.defaultVersion?.saleAmount ?? null]));
        const qty = new Map(stock?.items.map((s) => [s.itemId, s.mainQuantity]));
        const rows = items.items.map((item) => ({
          item,
          saleAmount: rate.get(item.id) ?? null,
          stockQuantity: item.isStockManaged ? (qty.get(item.id) ?? null) : null,
        }));
        this.show(rows, search, addSingle);
      },
      error: (error: unknown) => this.message.set(messageForError(error, this.translate)),
    });
  }

  private show(rows: ItemSuggestion[], search: string, addSingle: boolean): void {
    this.active.set(-1);
    if (!addSingle) {
      this.suggestions.set(rows);
      return;
    }

    const exact = rows.find((r) => r.item.code.toLowerCase() === search.toLowerCase());
    if (exact || rows.length === 1) {
      this.pick((exact ?? rows[0]).item);
    } else if (rows.length === 0) {
      this.suggestions.set([]);
      this.message.set(this.translate.instant('errors.sales.item_not_found'));
    } else {
      this.suggestions.set(rows);
    }
  }
}
