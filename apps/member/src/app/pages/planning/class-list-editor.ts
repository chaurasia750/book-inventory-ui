import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PlanningService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ClassBookListView, ItemSummary } from '@org/shared-models';
import { ButtonComponent, SidePanelComponent } from '@org/ui';
import { BulkItemPickerComponent, BulkPick } from '../sales/bulk-item-picker';
import { ItemEntryComponent } from '../sales/item-entry';

interface BookRow {
  itemId: string;
  code: string;
  name: string;
  qty: number;
  change: 'SAME' | 'ADDED' | 'CHANGED';
  previous: number | null;
}

/**
 * Planning spec R2, R3, R5, R7: one class's book list for a session, in the side panel (a list can be long: the table scrolls inside the
 * panel with its header kept, the Save and Cancel buttons stay at the bottom, and on a small screen the panel takes the full width). Add books by scan or search or pick many, set the copies per
 * student and the approximate number of students, save (the list is replaced as a whole) or delete. Books added or changed since
 * the previous session are marked; books removed since then are listed. Staff see it read-only.
 */
@Component({
  selector: 'app-class-list-editor',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent, SidePanelComponent, ItemEntryComponent, BulkItemPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-side-panel [isOpen]="true" panelWidth="min(720px, 100vw)" [title]="'planning.editorTitle' | translate: { className: list().className, session: session() }" (closed)="closed.emit()">
      <div class="flex min-h-0 flex-1 flex-col gap-3">
        @if (error()) { <p class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
        @if (canEdit()) {
          <div class="flex flex-wrap items-end gap-2">
            <div class="min-w-[12rem] flex-1"><app-item-entry (picked)="addItem($event)" /></div>
            <app-button size="lg" variant="secondary" (clicked)="bulkOpen.set(true)">{{ 'planning.bulk' | translate }}</app-button>
            <label class="text-xs text-gray-500">{{ 'planning.estimate' | translate }}
              <input type="number" min="0" max="5000" step="1" [value]="estimate() ?? ''" (change)="estimate.set($any($event.target).value === '' ? null : +$any($event.target).value); dirty.set(true)"
                class="mt-1 block h-12 w-28 rounded-xl border border-gray-200 bg-gray-50 px-2 text-right text-sm shadow-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </label>
          </div>
        } @else {
          <p class="text-sm">{{ 'planning.estimate' | translate }}: <span class="font-mono">{{ estimate() ?? '-' }}</span></p>
        }
        <div class="min-h-[10rem] flex-1 overflow-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
              <tr>
                <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                <th class="px-3 py-2 text-right font-semibold">{{ 'planning.qtyPerStudent' | translate }}</th>
                <th class="px-3 py-2 font-semibold"></th>
                @if (canEdit()) { <th class="px-3 py-2"></th> }
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-charcoal-700">
              @for (r of rows(); track r.itemId; let i = $index) {
                <tr>
                  <td class="px-3 py-1.5"><span class="font-medium text-primary-fg">{{ r.name }}</span> <span class="font-mono text-gray-500">{{ r.code }}</span></td>
                  <td class="px-3 py-1.5 text-right">
                    @if (canEdit()) {
                      <input type="number" min="1" max="50" step="1" [value]="r.qty" (change)="setQty(i, +$any($event.target).value)" class="h-8 w-16 rounded border border-gray-300 px-2 text-right text-xs" [attr.aria-label]="'planning.qtyPerStudent' | translate" />
                    } @else { {{ r.qty }} }
                  </td>
                  <td class="px-3 py-1.5 text-[10px] font-semibold text-yellow-800">
                    @if (r.change === 'ADDED') { {{ 'planning.changes.ADDED' | translate }} }
                    @else if (r.change === 'CHANGED') { {{ 'planning.changes.CHANGED' | translate: { n: r.previous } }} }
                  </td>
                  @if (canEdit()) { <td class="px-3 py-1.5 text-right"><button type="button" (click)="remove(i)" class="text-red-600 hover:underline" [attr.aria-label]="'planning.remove' | translate">&times;</button></td> }
                </tr>
              } @empty {
                <tr><td colspan="4" class="py-6 text-center text-sm text-gray-400">{{ 'planning.empty' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        @if (list().removed.length) {
          <p class="m-0 text-xs text-gray-500">{{ 'planning.changes.removed' | translate: { session: previousSession() } }}
            @for (r of list().removed; track r.itemId) { <span class="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 line-through">{{ r.itemName }}</span> }
          </p>
        }
        @if (canEdit()) {
          <div class="flex shrink-0 items-center justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-charcoal-700">
            <div>
              @if (list().hasList) { <app-button size="sm" variant="danger" (clicked)="delete()">{{ 'planning.delete' | translate }}</app-button> }
            </div>
            <div class="flex gap-2">
              <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
              <app-button [loading]="saving()" [disabled]="rows().length === 0" (clicked)="save()">{{ 'planning.save' | translate }}</app-button>
            </div>
          </div>
        }
      </div>
    </app-side-panel>
    <app-bulk-item-picker [open]="bulkOpen()" [classes]="classes()" [askQuantity]="false" (closed)="bulkOpen.set(false)" (picked)="bulkPicked($event)" />
  `,
})
export class ClassListEditorComponent {
  readonly schoolId = input.required<string>();
  readonly session = input.required<string>();
  readonly previousSession = input.required<string>();
  readonly list = input.required<ClassBookListView>();
  readonly classes = input<string[]>([]);
  readonly canEdit = input(false);
  readonly closed = output<void>();
  readonly saved = output<void>();

  private readonly planning = inject(PlanningService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<BookRow[]>([]);
  readonly estimate = signal<number | null>(null);
  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly bulkOpen = signal(false);
  readonly count = computed(() => this.rows().length);

  constructor() {
    effect(() => {
      const list = this.list();
      untracked(() => {
        this.rows.set(list.lines.map((l) => ({ itemId: l.itemId, code: l.itemCode, name: l.itemName, qty: l.quantityPerStudent, change: l.change, previous: l.previousQuantityPerStudent })));
        this.estimate.set(list.studentEstimate);
        this.dirty.set(false);
      });
    });
  }

  /** R2: the same item twice stays one row. */
  addItem(item: ItemSummary): void {
    this.rows.update((rs) => (rs.some((r) => r.itemId === item.id) ? rs : [...rs, { itemId: item.id, code: item.code, name: item.name, qty: 1, change: 'ADDED', previous: null }]));
    this.dirty.set(true);
  }

  bulkPicked(pick: BulkPick): void {
    this.bulkOpen.set(false);
    for (const item of pick.items) {
      this.addItem(item);
    }
  }

  setQty(index: number, qty: number): void {
    this.rows.update((rs) => rs.map((r, i) => (i === index ? { ...r, qty } : r)));
    this.dirty.set(true);
  }

  remove(index: number): void {
    this.rows.update((rs) => rs.filter((_, i) => i !== index));
    this.dirty.set(true);
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const request = { studentEstimate: this.estimate(), lines: this.rows().map((r) => ({ itemId: r.itemId, quantityPerStudent: Number(r.qty) })) };
    this.planning.saveBookList(this.schoolId(), this.session(), this.list().className, request).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(messageForError(e, this.translate));
      },
    });
  }

  delete(): void {
    if (!window.confirm(this.translate.instant('planning.deleteConfirm'))) {
      return;
    }
    this.planning.deleteBookList(this.schoolId(), this.session(), this.list().className).subscribe({
      next: () => this.saved.emit(),
      error: (e: unknown) => this.error.set(messageForError(e, this.translate)),
    });
  }
}
