import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PurchaseService, VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { ItemSummary, RETURN_STOCK_SOURCES, ReturnStockSource, VendorReturnLineRequest, VendorReturnMade, VendorSummary } from '@org/shared-models';
import { ButtonComponent, CardComponent, CloseButtonComponent, DatePickerComponent } from '@org/ui';
import { ItemEntryComponent } from '../sales/item-entry';
import { MoneyPrefixComponent } from '../counters/money-prefix';

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';
const VENDOR_CHOICES = 200;

/** One line the user is filling: an item picked with the order editor's item entry, where it leaves from, the quantity and an optional rate. */
interface ReturnRow {
  itemId: string;
  name: string;
  code: string;
  quantity: string;
  source: ReturnStockSource;
  rate: string;
}

/**
 * The form for a new vendor return, shown in the panel beside the list (platform U10, purchase spec R2-R7): an active vendor, the date,
 * the items found like the order editor, the stock source (Main or Damaged) and the quantity of each line and, if wanted, a changed
 * rate (empty: the item's purchase price, which the server fills). The totals are the server's, shown in the panel after saving; low
 * stock is a notice there, never a refusal (R6).
 */
@Component({
  selector: 'app-vendor-return-add',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, CardComponent, CloseButtonComponent, DatePickerComponent, ItemEntryComponent, MoneyPrefixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <h1 class="mr-auto text-xl font-semibold text-primary-fg">{{ 'purchase.add.title' | translate }}</h1>
        <app-close-button [label]="'counter.close' | translate" (clicked)="closed.emit()" />
      </div>
      <app-card>
        <form class="space-y-4" (submit)="$event.preventDefault(); save()">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="vr-vendor" class="${LABEL}">{{ 'purchase.fields.vendor' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <select id="vr-vendor" [formControl]="vendor" class="${FIELD}">
                <option value="">{{ 'purchase.fields.chooseVendor' | translate }}</option>
                @for (v of vendors(); track v.id) { <option [value]="v.id">{{ v.name }} ({{ v.code }})</option> }
              </select>
            </div>
            <div>
              <label for="vr-date" class="${LABEL}">{{ 'purchase.fields.date' | translate }}</label>
              <app-date-picker inputId="vr-date" [formControl]="returnDate" />
            </div>
          </div>

          <div class="min-w-[16rem]"><app-item-entry (picked)="addItem($event)" /></div>
          @if (rows().length === 0) {
            <p class="m-0 rounded-lg border border-dashed border-neutral-300 px-3 py-4 text-center text-sm text-gray-500">{{ 'purchase.lines.none' | translate }}</p>
          } @else {
            <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
              <table class="w-full min-w-[560px] text-left text-xs">
                <thead class="bg-neutral-50 text-[11px] uppercase tracking-[0.05em] text-gray-500 dark:bg-charcoal-900">
                  <tr>
                    <th class="px-3 py-2 font-semibold">{{ 'sales.columns.item' | translate }}</th>
                    <th class="w-32 px-3 py-2 font-semibold">{{ 'purchase.lines.source' | translate }}</th>
                    <th class="w-24 px-3 py-2 text-right font-semibold">{{ 'sales.columns.qty' | translate }}</th>
                    <th class="w-28 px-3 py-2 text-right font-semibold">{{ 'purchase.lines.rate' | translate }} (₹)</th>
                    <th class="w-8"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-200 dark:divide-charcoal-700">
                  @for (row of rows(); track row.itemId) {
                    <tr>
                      <td class="px-3 py-2"><span class="font-medium text-primary-fg">{{ row.name }}</span> <span class="ml-1 font-mono text-gray-500">{{ row.code }}</span></td>
                      <td class="px-3 py-2">
                        <select [value]="row.source" [attr.aria-label]="'purchase.lines.source' | translate" (change)="patch(row.itemId, { source: $any($event.target).value })" class="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm">
                          @for (s of sources; track s) { <option [value]="s">{{ 'purchase.source.' + s | translate }}</option> }
                        </select>
                      </td>
                      <td class="px-3 py-2 text-right"><input type="number" min="1" step="1" [value]="row.quantity" [attr.aria-label]="'sales.columns.qty' | translate" (input)="patch(row.itemId, { quantity: $any($event.target).value })" class="h-9 w-20 rounded-lg border border-gray-300 px-2 text-right text-sm" /></td>
                      <td class="px-3 py-2 text-right"><app-money-prefix [inline]="true"><input type="number" min="0" step="0.01" [value]="row.rate" [placeholder]="'purchase.lines.rateAuto' | translate" [attr.aria-label]="'purchase.lines.rate' | translate" (input)="patch(row.itemId, { rate: $any($event.target).value })" class="h-9 w-24 rounded-lg border border-gray-300 px-2 text-right text-sm" /></app-money-prefix></td>
                      <td class="px-1"><button type="button" class="text-gray-400 hover:text-red-600" [attr.aria-label]="'purchase.lines.remove' | translate" (click)="remove(row.itemId)">✕</button></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <div>
            <label for="vr-remark" class="${LABEL}">{{ 'purchase.fields.remark' | translate }}</label>
            <input id="vr-remark" [formControl]="remark" maxlength="500" class="${FIELD}" />
          </div>
          @if (error()) { <p class="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ error() }}</p> }
          <div class="flex justify-end gap-2">
            <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="!canSave()">{{ 'purchase.add.submit' | translate }}</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class VendorReturnAddComponent {
  private readonly purchase = inject(PurchaseService);
  private readonly vendorsApi = inject(VendorService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly created = output<VendorReturnMade>();
  readonly closed = output<void>();

  readonly sources = RETURN_STOCK_SOURCES;
  readonly vendor = new FormControl('', { nonNullable: true });
  readonly returnDate = new FormControl('', { nonNullable: true });
  readonly remark = new FormControl('', { nonNullable: true });

  readonly vendors = signal<VendorSummary[]>([]);
  readonly rows = signal<ReturnRow[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');

  constructor() {
    this.vendorsApi
      .list({ status: 'ACTIVE', orderBy: 'Name ASC', pageIndex: 1, pageSize: VENDOR_CHOICES })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (page) => this.vendors.set(page.items), error: (e: unknown) => this.error.set(messageForError(e, this.translate)) });
  }

  canSave(): boolean {
    return !!this.vendor.value && this.rows().some((r) => Number(r.quantity) > 0);
  }

  addItem(item: ItemSummary): void {
    const existing = this.rows().find((r) => r.itemId === item.id);
    if (existing) {
      this.patch(item.id, { quantity: String(Number(existing.quantity || 0) + 1) });
      return;
    }
    this.rows.update((rows) => [...rows, { itemId: item.id, name: item.name, code: item.code, quantity: '1', source: 'MAIN', rate: '' }]);
  }

  patch(itemId: string, change: Partial<ReturnRow>): void {
    this.rows.update((rows) => rows.map((r) => (r.itemId === itemId ? { ...r, ...change } : r)));
  }

  remove(itemId: string): void {
    this.rows.update((rows) => rows.filter((r) => r.itemId !== itemId));
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.purchase
      .makeVendorReturn({
        vendorId: this.vendor.value,
        returnDate: this.returnDate.value || undefined,
        remark: this.remark.value.trim() || undefined,
        lines: this.rows().filter((r) => Number(r.quantity) > 0).map((r) => this.lineOf(r)),
      })
      .subscribe({
        next: (made) => {
          this.saving.set(false);
          this.created.emit(made);
        },
        error: (e: unknown) => {
          this.saving.set(false);
          this.error.set(messageForError(e, this.translate));
        },
      });
  }

  private lineOf(row: ReturnRow): VendorReturnLineRequest {
    return { itemId: row.itemId, quantity: Number(row.quantity), stockSource: row.source, rate: row.rate !== '' ? Number(row.rate) : undefined };
  }
}
