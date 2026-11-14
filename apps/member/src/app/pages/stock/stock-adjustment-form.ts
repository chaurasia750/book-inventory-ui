import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdjustStockRequest, STOCK_TYPES, StockType } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The adjustment form (stock spec R8): the stock type, the counted quantity after a physical count (a whole number, zero or more)
 * and the reason (5-500 characters), all required. The system posts the difference; a count equal to the current quantity is
 * refused by the API with its catalogue message, which the caller shows.
 */
@Component({
  selector: 'app-stock-adjustment-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      @if (error()) {
        <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
      }
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="sa-type" class="mb-1 block text-sm font-semibold">{{ 'stock.fields.stockType' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <select id="sa-type" formControlName="stockType" class="${FIELD}">
            @for (t of types; track t) { <option [value]="t">{{ 'stock.type.' + t | translate }}</option> }
          </select>
        </div>
        <div>
          <label for="sa-qty" class="mb-1 block text-sm font-semibold">{{ 'stock.fields.countedQuantity' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <input id="sa-qty" type="number" min="0" step="1" formControlName="countedQuantity" class="${FIELD}" />
        </div>
      </div>
      <div>
        <label for="sa-reason" class="mb-1 block text-sm font-semibold">{{ 'stock.fields.reason' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
        <textarea id="sa-reason" rows="2" maxlength="500" formControlName="reason" class="${FIELD} h-auto py-2"></textarea>
        <p class="mt-1 text-xs text-gray-500">{{ 'stock.fields.reasonHint' | translate }}</p>
      </div>
      @if (form.touched && form.invalid) {
        <p class="text-xs text-red-600">{{ 'stock.fields.adjustmentInvalid' | translate }}</p>
      }
      <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <app-button variant="secondary" (clicked)="cancelled.emit()">{{ 'users.cancel' | translate }}</app-button>
        <app-button type="submit" [loading]="saving()">{{ 'stock.adjustment.submit' | translate }}</app-button>
      </div>
    </form>
  `,
})
export class StockAdjustmentFormComponent {
  saving = input(false);
  error = input('');

  submitted = output<AdjustStockRequest>();
  cancelled = output<void>();

  readonly types = STOCK_TYPES;

  readonly form = new FormGroup({
    stockType: new FormControl<StockType>('MAIN', { nonNullable: true, validators: [Validators.required] }),
    countedQuantity: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)] }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.submitted.emit({ stockType: v.stockType, countedQuantity: Number(v.countedQuantity), reason: v.reason.trim() });
  }
}
