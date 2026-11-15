import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyProfile } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const CARD = 'flex flex-col gap-3';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';

/**
 * Company spec R21: the company's address, mobile, email, GSTIN, PAN and tagline, edited by the Owner. The name and the state are
 * shown, not editable (the Super Admin keeps them, R2). The API checks every value again and its catalogue message is shown.
 */
@Component({
  selector: 'app-company-details-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="card">
      <dl class="m-0 grid gap-3 sm:grid-cols-2">
        <div><dt [class]="label">{{ 'companyProfile.details.name' | translate }}</dt><dd class="m-0 text-sm font-medium text-primary-fg">{{ profile().name }}</dd></div>
        <div><dt [class]="label">{{ 'companyProfile.details.state' | translate }}</dt><dd class="m-0 text-sm font-medium text-primary-fg">{{ profile().state || '-' }}</dd></div>
      </dl>
      <p class="m-0 text-xs text-gray-500">{{ 'companyProfile.details.fixedHint' | translate }}</p>
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2"><label for="cd-address" [class]="label">{{ 'companyProfile.details.address' | translate }}</label><textarea id="cd-address" rows="2" formControlName="address" class="w-full rounded-lg border border-gray-300 p-2 text-sm"></textarea></div>
        <div><label for="cd-mobile" [class]="label">{{ 'companyProfile.details.mobile' | translate }}</label><input id="cd-mobile" formControlName="mobile" [class]="field" /></div>
        <div><label for="cd-email" [class]="label">{{ 'companyProfile.details.email' | translate }}</label><input id="cd-email" type="email" formControlName="email" [class]="field" /></div>
        <div><label for="cd-gstin" [class]="label">GSTIN</label><input id="cd-gstin" formControlName="gstin" maxlength="15" [class]="field + ' font-mono uppercase'" /></div>
        <div><label for="cd-pan" [class]="label">PAN</label><input id="cd-pan" formControlName="pan" maxlength="10" [class]="field + ' font-mono uppercase'" /></div>
        <div class="sm:col-span-2"><label for="cd-tagline" [class]="label">{{ 'companyProfile.details.tagline' | translate }}</label><input id="cd-tagline" formControlName="tagline" maxlength="200" [class]="field" /></div>
      </form>
      @if (message()) { <p class="m-0 text-sm" [class.text-red-600]="isError()" [class.text-green-700]="!isError()" role="status">{{ message() }}</p> }
      <div class="flex justify-end"><app-button [loading]="saving()" (clicked)="save()">{{ 'companyProfile.save' | translate }}</app-button></div>
    </section>
  `,
})
export class CompanyDetailsFormComponent {
  readonly companyId = input.required<string>();
  readonly profile = input.required<CompanyProfile>();

  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  readonly card = CARD;
  readonly label = LABEL;
  readonly field = FIELD;
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly form = new FormGroup({
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    mobile: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(254)] }),
    gstin: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(15)] }),
    pan: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    tagline: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
  });

  constructor() {
    effect(() => {
      const p = this.profile();
      this.form.reset({ address: p.address ?? '', mobile: p.mobile ?? '', email: p.email ?? '', gstin: p.gstin ?? '', pan: p.pan ?? '', tagline: p.tagline ?? '' });
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
    this.companies.editProfile(this.companyId(), { address: v.address.trim(), mobile: v.mobile.trim(), email: v.email.trim(), gstin: v.gstin.trim().toUpperCase(), pan: v.pan.trim().toUpperCase(), tagline: v.tagline.trim() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.show(this.translate.instant('companyProfile.saved'), false);
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
