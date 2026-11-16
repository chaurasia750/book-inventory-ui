import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompanyService } from '@org/api-services';
import { messageForError } from '@org/interceptors';
import { CompanyBankDetails } from '@org/shared-models';
import { ButtonComponent } from '@org/ui';

const FIELD = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const CARD = 'flex flex-col gap-3';
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500';

/** The five values of the account are all present or all absent (company R19, the same rule as a vendor's account, vendor R5). */
function allOrNone(group: AbstractControl): ValidationErrors | null {
  const names = ['accountHolder', 'bankName', 'branch', 'accountNumber', 'ifsc'];
  const filled = names.filter((n) => !!(group.get(n)?.value as string).trim()).length;
  return filled === 0 || filled === names.length ? null : { allOrNone: true };
}

/**
 * Company spec R19: the company's one bank account (holder, bank, branch, account number of 9-18 digits, IFSC) and its UPI id,
 * printed at the bottom of every invoice. The common mistakes show before the request; the API checks again (`company.invalid_bank`).
 */
@Component({
  selector: 'app-company-bank-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="card">
      <p class="m-0 text-xs text-gray-500">{{ 'companyProfile.bank.hint' | translate }}</p>
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-2">
        <div><label for="cb-holder" [class]="label">{{ 'companyProfile.bank.accountHolder' | translate }}</label><input id="cb-holder" formControlName="accountHolder" maxlength="150" [class]="field" /></div>
        <div><label for="cb-bank" [class]="label">{{ 'companyProfile.bank.bankName' | translate }}</label><input id="cb-bank" formControlName="bankName" maxlength="150" [class]="field" /></div>
        <div><label for="cb-branch" [class]="label">{{ 'companyProfile.bank.branch' | translate }}</label><input id="cb-branch" formControlName="branch" maxlength="150" [class]="field" /></div>
        <div><label for="cb-number" [class]="label">{{ 'companyProfile.bank.accountNumber' | translate }}</label><input id="cb-number" formControlName="accountNumber" inputmode="numeric" maxlength="18" [class]="field + ' font-mono'" /></div>
        <div><label for="cb-ifsc" [class]="label">IFSC</label><input id="cb-ifsc" formControlName="ifsc" maxlength="11" [class]="field + ' font-mono uppercase'" /></div>
        <div><label for="cb-upi" [class]="label">UPI</label><input id="cb-upi" formControlName="upiId" maxlength="100" [class]="field + ' font-mono'" /></div>
      </form>
      @if (form.touched && form.errors?.['allOrNone']) { <p class="m-0 text-xs text-red-600" role="alert">{{ 'errors.company.invalid_bank' | translate }}</p> }
      @if (message()) { <p class="m-0 text-sm" [class.text-red-600]="isError()" [class.text-green-700]="!isError()" role="status">{{ message() }}</p> }
      <div class="flex justify-end"><app-button [loading]="saving()" (clicked)="save()">{{ 'companyProfile.save' | translate }}</app-button></div>
    </section>
  `,
})
export class CompanyBankFormComponent {
  readonly companyId = input.required<string>();
  readonly bank = input.required<CompanyBankDetails>();

  /** The bank account was saved; the screen reads it again so another tab or a later visit shows the saved values. */
  readonly saved = output<void>();

  private readonly companies = inject(CompanyService);
  private readonly translate = inject(TranslateService);

  readonly card = CARD;
  readonly label = LABEL;
  readonly field = FIELD;
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly form = new FormGroup(
    {
      accountHolder: new FormControl('', { nonNullable: true }),
      bankName: new FormControl('', { nonNullable: true }),
      branch: new FormControl('', { nonNullable: true }),
      accountNumber: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{9,18}$/)] }),
      ifsc: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)] }),
      upiId: new FormControl('', { nonNullable: true }),
    },
    { validators: [allOrNone] },
  );

  constructor() {
    effect(() => {
      const b = this.bank();
      this.form.reset({ accountHolder: b.accountHolder ?? '', bankName: b.bankName ?? '', branch: b.branch ?? '', accountNumber: b.accountNumber ?? '', ifsc: b.ifsc ?? '', upiId: b.upiId ?? '' });
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.show(this.translate.instant('errors.company.invalid_bank'), true);
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.message.set('');
    const bank = { accountHolder: v.accountHolder.trim(), bankName: v.bankName.trim(), branch: v.branch.trim(), accountNumber: v.accountNumber.trim(), ifsc: v.ifsc.trim().toUpperCase(), upiId: v.upiId.trim() };
    this.companies.setInvoiceIdentity(this.companyId(), { bank }).subscribe({
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
