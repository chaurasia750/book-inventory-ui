import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyInvoiceSettings } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const CARD = 'flex flex-col gap-3';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';

/**
 * Company spec R20: the terms and conditions (one numbered item per line on the invoice), the footer line and whether the GSTIN
 * prints in the header of the company's documents.
 */
@Component({
  selector: 'app-company-invoice-settings',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="card">
      <form [formGroup]="form" class="flex flex-col gap-3">
        <div>
          <label for="cs-terms" [class]="label">{{ 'companyProfile.settings.terms' | translate }}</label>
          <textarea id="cs-terms" rows="6" formControlName="terms" maxlength="4000" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea>
          <p class="m-0 mt-1 text-xs text-gray-500">{{ 'companyProfile.settings.termsHint' | translate }}</p>
        </div>
        <div><label for="cs-footer" [class]="label">{{ 'companyProfile.settings.footer' | translate }}</label><input id="cs-footer" formControlName="footer" maxlength="200" [class]="field" /></div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="printGstin" class="h-4 w-4" /> {{ 'companyProfile.settings.printGstin' | translate }}</label>
        <div>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="usesItemDiscount" class="h-4 w-4" /> {{ 'companyProfile.settings.usesItemDiscount' | translate }}</label>
          <p class="m-0 mt-1 text-xs text-gray-500">{{ 'companyProfile.settings.usesItemDiscountHint' | translate }}</p>
        </div>
      </form>
      @if (message()) { <p class="m-0 text-sm" [class.text-red-600]="isError()" [class.text-green-700]="!isError()" role="status">{{ message() }}</p> }
      <div class="flex justify-end"><app-button [loading]="saving()" (clicked)="save()">{{ 'companyProfile.save' | translate }}</app-button></div>
    </section>
  `,
})
export class CompanyInvoiceSettingsComponent {
  readonly companyId = input.required<string>();
  readonly settings = input.required<CompanyInvoiceSettings>();
  /** The settings were saved; the screen reads them again so another tab or a later visit shows the saved values. */
  readonly saved = output<void>();

  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  readonly card = CARD;
  readonly label = LABEL;
  readonly field = FIELD;
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly form = new FormGroup({
    terms: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
    footer: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    printGstin: new FormControl(true, { nonNullable: true }),
    usesItemDiscount: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const s = this.settings();
      this.form.reset({ terms: s.terms ?? '', footer: s.footer ?? '', printGstin: s.printGstin, usesItemDiscount: s.usesItemDiscount });
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.message.set('');
    this.companies.setInvoiceIdentity(this.companyId(), { invoice: { terms: v.terms.trim(), footer: v.footer.trim(), printGstin: v.printGstin, usesItemDiscount: v.usesItemDiscount } }).subscribe({
      next: () => {
        this.saving.set(false);
        this.show(this.translate.instant('companyProfile.saved'), false);
        this.saved.emit();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.show(messageForError(e, this.translate), true);
      },
    });
  }

  private show(text: string, error: boolean): void {
    this.message.set(text);
    this.isError.set(error);
  }
}
