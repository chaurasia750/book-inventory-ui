import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PriceVersion, PriceVersionFields } from '@org/shared-models';
import { ButtonComponent, DatePickerComponent } from '@org/ui';
import { MoneyPrefixComponent } from '../counters/money-prefix';

const FIELD = 'h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * The form of one price version (price spec R2): name, effective date and the three prices, all required. It validates what the
 * API validates (name length, amounts not negative) so the common mistakes show before the request; the API refuses a repeated
 * name, a value with more than two decimals and the rest with its catalogue message, which the caller shows.
 */
@Component({
  selector: 'app-price-version-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent, DatePickerComponent, MoneyPrefixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      @if (error()) {
        <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600" role="alert">{{ error() }}</p>
      }
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="pv-name" class="mb-1 block text-sm font-semibold">{{ 'price.fields.versionName' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <input id="pv-name" formControlName="versionName" class="${FIELD}" />
        </div>
        <div>
          <label for="pv-date" class="mb-1 block text-sm font-semibold">{{ 'price.fields.effectiveFrom' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <app-date-picker inputId="pv-date" formControlName="effectiveFrom" />
        </div>
        <div>
          <label for="pv-mrp" class="mb-1 block text-sm font-semibold">{{ 'price.fields.mrp' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <app-money-prefix><input id="pv-mrp" type="number" step="0.01" min="0" formControlName="mrpAmount" class="${FIELD}" /></app-money-prefix>
        </div>
        <div>
          <label for="pv-sale" class="mb-1 block text-sm font-semibold">{{ 'price.fields.sale' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <app-money-prefix><input id="pv-sale" type="number" step="0.01" min="0" formControlName="saleAmount" class="${FIELD}" /></app-money-prefix>
        </div>
        <div>
          <label for="pv-purchase" class="mb-1 block text-sm font-semibold">{{ 'price.fields.purchase' | translate }}<span class="text-red-500" aria-hidden="true"> *</span></label>
          <app-money-prefix><input id="pv-purchase" type="number" step="0.01" min="0" formControlName="purchaseAmount" class="${FIELD}" /></app-money-prefix>
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <app-button variant="secondary" (clicked)="cancelled.emit()">{{ 'users.cancel' | translate }}</app-button>
        <app-button type="submit" [loading]="saving()">{{ submitLabel() | translate }}</app-button>
      </div>
    </form>
  `,
})
export class PriceVersionFormComponent {
  /** The version being edited, or null for a new one. */
  version = input<PriceVersion | null>(null);
  saving = input(false);
  error = input('');
  submitLabel = input('price.add.submit');

  submitted = output<PriceVersionFields>();
  cancelled = output<void>();

  readonly form = new FormGroup({
    versionName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)] }),
    effectiveFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    mrpAmount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    saleAmount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    purchaseAmount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
  });

  constructor() {
    effect(() => {
      const v = this.version();
      this.form.reset(
        v
          ? {
              versionName: v.versionName,
              effectiveFrom: v.effectiveFrom,
              mrpAmount: v.mrpAmount,
              saleAmount: v.saleAmount,
              purchaseAmount: v.purchaseAmount ?? 0,
            }
          : { versionName: '', effectiveFrom: '', mrpAmount: 0, saleAmount: 0, purchaseAmount: 0 },
      );
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.submitted.emit({
      versionName: v.versionName.trim(),
      effectiveFrom: v.effectiveFrom,
      mrpAmount: v.mrpAmount,
      saleAmount: v.saleAmount,
      purchaseAmount: v.purchaseAmount,
    });
  }
}
