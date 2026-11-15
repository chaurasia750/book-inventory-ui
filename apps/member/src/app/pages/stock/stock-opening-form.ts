import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EnterOpeningRequest, STOCK_TYPES, StockType } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The opening stock form (stock spec R7): stock type, quantity (a whole number above zero) and the date counting starts, all
 * required. The API refuses a second opening of the same stock type with its catalogue message, which the caller shows.
 */
@Component({
  selector: 'app-stock-opening-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      @if (error()) {
        <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
      }
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="so-type" class="mb-1 block text-sm font-semibold">{{ 'stock.fields.stockType' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <select id="so-type" formControlName="stockType" class="${FIELD}">
            @for (t of types; track t) { <option [value]="t">{{ 'stock.type.' + t | translate }}</option> }
          </select>
        </div>
        <div>
          <label for="so-qty" class="mb-1 block text-sm font-semibold">{{ 'stock.fields.quantity' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <input id="so-qty" type="number" min="1" step="1" formControlName="quantity" class="${FIELD}" />
        </div>
        <div>
          <label for="so-date" class="mb-1 block text-sm font-semibold">{{ 'stock.fields.openingDate' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <app-date-picker inputId="so-date" formControlName="openingDate" />
        </div>
      </div>
      @if (form.touched && form.invalid) {
        <p class="text-xs text-red-600">{{ 'stock.fields.wholeAboveZero' | translate }}</p>
      }
      <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <app-button variant="secondary" (clicked)="cancelled.emit()">{{ 'users.cancel' | translate }}</app-button>
        <app-button type="submit" [loading]="saving()">{{ 'stock.opening.submit' | translate }}</app-button>
      </div>
    </form>
  `,
})
export class StockOpeningFormComponent {
  saving = input(false);
  error = input('');

  submitted = output<EnterOpeningRequest>();
  cancelled = output<void>();

  readonly types = STOCK_TYPES;

  readonly form = new FormGroup({
    stockType: new FormControl<StockType>('MAIN', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)] }),
    openingDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.submitted.emit({ stockType: v.stockType, quantity: Number(v.quantity), openingDate: v.openingDate });
  }
}
