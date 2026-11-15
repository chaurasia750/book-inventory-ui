import { ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ItemService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ItemSummary } from '@org/shared-models';

/**
 * The line entry of the order editor (sales spec R4): type a name or code, or scan a barcode. While typing, the matches are listed to pick from; Enter
 * adds a single or exact match at once (a scan keeps the focus for the next one); none shows "item not found".
 */
@Component({
  selector: 'app-item-entry',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <label for="oe-scan" class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">{{ 'sales.editor.addItem' | translate }}</label>
      <input #box id="oe-scan" type="search" autocomplete="off" [placeholder]="'sales.editor.scanHint' | translate" (input)="suggest(box.value)" (keydown.enter)="find(box.value); $event.preventDefault()" (keydown.escape)="matches.set([])"
        class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
      @if (message()) {
        <p class="mt-1 text-xs text-red-600" role="alert">{{ message() }}</p>
      }
      @if (matches().length > 0) {
        <ul class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
          @for (m of matches(); track m.id) {
            <li>
              <button type="button" (click)="pick(m)" class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <span class="truncate">{{ m.name }}</span><span class="font-mono text-xs text-gray-500">{{ m.code }}</span>
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
  private readonly translate = inject(TranslateService);
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  readonly matches = signal<ItemSummary[]>([]);
  readonly message = signal('');
  private typingTimer: ReturnType<typeof setTimeout> | undefined;

  /** Lists the matches while typing (after a short pause, from two characters); nothing is added until one is picked or Enter is pressed. */
  suggest(text: string): void {
    clearTimeout(this.typingTimer);
    this.message.set('');
    const search = text.trim();
    if (search.length < 2) {
      this.matches.set([]);
      return;
    }

    this.typingTimer = setTimeout(() => {
      this.items.list({ search, status: 'ACTIVE', pageIndex: 1, pageSize: 8 }).subscribe({
        next: (page) => {
          if (this.box().nativeElement.value.trim() === search) {
            this.matches.set(page.items);
          }
        },
        error: (error: unknown) => this.message.set(messageForError(error, this.translate)),
      });
    }, 250);
  }

  find(text: string): void {
    clearTimeout(this.typingTimer);
    const search = text.trim();
    this.message.set('');
    this.matches.set([]);
    if (!search) {
      return;
    }

    this.items.list({ search, status: 'ACTIVE', pageIndex: 1, pageSize: 8 }).subscribe({
      next: (page) => {
        const exact = page.items.find((i) => i.code.toLowerCase() === search.toLowerCase());
        if (exact || page.items.length === 1) {
          this.pick(exact ?? page.items[0]);
        } else if (page.items.length === 0) {
          this.message.set(this.translate.instant('errors.sales.item_not_found'));
        } else {
          this.matches.set(page.items);
        }
      },
      error: (error: unknown) => this.message.set(messageForError(error, this.translate)),
    });
  }

  pick(item: ItemSummary): void {
    this.matches.set([]);
    this.picked.emit(item);
    const box = this.box().nativeElement;
    box.value = '';
    box.focus();
  }
}
