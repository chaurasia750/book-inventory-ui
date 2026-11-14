import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PriceService, VendorService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CopyPriceResult, ITEM_CATEGORIES, ItemCategory } from '@org/shared-models';
import { ButtonComponent, ModalComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The "Copy version" dialog (price spec R8): copy one version name to a new name and date for a group of items (a category or a
 * class, or all). The answer says how many items were copied and how many were skipped and why; nothing is overwritten.
 */
@Component({
  selector: 'app-price-copy',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="'price.copy.title' | translate" (closed)="closed.emit()">
      @if (result(); as r) {
        <div class="space-y-3 text-sm" role="status">
          <p class="font-semibold text-primary-fg">{{ 'price.copy.done' | translate }}</p>
          <ul class="list-disc pl-5 text-gray-600">
            <li>{{ 'price.copy.selected' | translate }}: {{ r.itemsSelected }}</li>
            <li>{{ 'price.copy.copied' | translate }}: {{ r.copied }}</li>
            <li>{{ 'price.copy.noSource' | translate }}: {{ r.skippedNoSourceVersion }}</li>
            <li>{{ 'price.copy.alreadyHas' | translate }}: {{ r.skippedAlreadyHasTarget }}</li>
          </ul>
          <div class="flex justify-end"><app-button (clicked)="closeAfterResult()">{{ 'price.copy.close' | translate }}</app-button></div>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          @if (error()) {
            <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
          }
          <p class="text-xs text-gray-500">{{ 'price.copy.hint' | translate }}</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="pc-from" class="mb-1 block text-sm font-semibold">{{ 'price.copy.from' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="pc-from" formControlName="fromVersionName" class="${FIELD}" />
            </div>
            <div>
              <label for="pc-to" class="mb-1 block text-sm font-semibold">{{ 'price.copy.to' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="pc-to" formControlName="toVersionName" class="${FIELD}" />
            </div>
            <div>
              <label for="pc-date" class="mb-1 block text-sm font-semibold">{{ 'price.fields.effectiveFrom' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
              <input id="pc-date" type="date" formControlName="effectiveFrom" class="${FIELD}" />
            </div>
            <div>
              <label for="pc-vendor" class="mb-1 block text-sm font-semibold">{{ 'price.selection.vendor' | translate }}</label>
              <select id="pc-vendor" formControlName="vendorId" class="${FIELD}">
                <option value="">{{ 'price.selection.anyVendor' | translate }}</option>
                @for (v of vendorOptions(); track v.id) { <option [value]="v.id">{{ v.name }}</option> }
              </select>
            </div>
            <div>
              <label for="pc-category" class="mb-1 block text-sm font-semibold">{{ 'price.selection.category' | translate }}</label>
              <select id="pc-category" formControlName="category" class="${FIELD}">
                <option value="">{{ 'price.selection.anyCategory' | translate }}</option>
                @for (c of categories; track c) { <option [value]="c">{{ 'item.category.' + c | translate }}</option> }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label for="pc-class" class="mb-1 block text-sm font-semibold">{{ 'price.selection.className' | translate }}</label>
              <input id="pc-class" formControlName="className" class="${FIELD}" />
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <app-button variant="secondary" (clicked)="closed.emit()">{{ 'users.cancel' | translate }}</app-button>
            <app-button type="submit" [loading]="saving()">{{ 'price.copy.submit' | translate }}</app-button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class PriceCopyComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  /** The copy changed prices: the list reloads. */
  readonly copied = output<void>();

  private readonly prices = inject(PriceService);
  private readonly vendors = inject(VendorService);
  private readonly translate = inject(TranslateService);

  readonly categories = ITEM_CATEGORIES;
  readonly vendorOptions = signal<{ id: string; name: string }[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly result = signal<CopyPriceResult | null>(null);

  readonly form = new FormGroup({
    fromVersionName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)] }),
    toVersionName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)] }),
    effectiveFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    vendorId: new FormControl('', { nonNullable: true }),
    category: new FormControl<ItemCategory | ''>('', { nonNullable: true }),
    className: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.vendors
      .list({ status: 'ACTIVE', orderBy: 'Name ASC', pageIndex: 1, pageSize: 200 })
      .subscribe((result) => this.vendorOptions.set(result.items.map((v) => ({ id: v.id, name: v.name }))));
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.prices
      .copy({
        fromVersionName: v.fromVersionName.trim(),
        toVersionName: v.toVersionName.trim(),
        effectiveFrom: v.effectiveFrom,
        selection: { vendorId: v.vendorId || undefined, category: v.category || undefined, className: v.className.trim() || undefined },
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.result.set(result);
          this.copied.emit();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(messageForError(error, this.translate));
        },
      });
  }

  closeAfterResult(): void {
    this.result.set(null);
    this.form.reset({ vendorId: '', category: '' });
    this.closed.emit();
  }
}
