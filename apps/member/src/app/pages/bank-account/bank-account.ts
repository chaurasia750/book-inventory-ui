import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-bank-account',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-default bg-surface p-5 lg:p-6">
      <h3 class="mb-5 text-lg font-semibold text-primary-fg lg:mb-7">Bank Account Details</h3>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6" novalidate>
        @if (saveSuccess()) {
          <div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <svg class="h-5 w-5 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <p class="text-sm font-medium text-emerald-800">Bank details saved successfully!</p>
          </div>
        }

        <div class="grid grid-cols-12 gap-4 md:gap-6">
          <div class="col-span-12 lg:col-span-6">
            <div class="p-5 border border-default rounded-2xl lg:p-6 space-y-4">
              <h4 class="text-base font-semibold text-primary-fg">Account Information</h4>

              <div class="relative">
                <input id="bankName" type="text" formControlName="bankName" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="bankName" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  Bank Name <span class="text-red-400">*</span>
                </label>
              </div>

              <div class="relative">
                <input id="accountHolder" type="text" formControlName="accountHolder" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="accountHolder" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  Account Holder Name <span class="text-red-400">*</span>
                </label>
              </div>

              <div class="relative">
                <input id="accountNumber" type="text" formControlName="accountNumber" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm tracking-wider text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="accountNumber" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  Account Number <span class="text-red-400">*</span>
                </label>
              </div>

              <div class="relative">
                <input id="confirmAccount" type="text" formControlName="confirmAccount" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm tracking-wider text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="confirmAccount" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  Confirm Account Number <span class="text-red-400">*</span>
                </label>
              </div>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-6">
            <div class="p-5 border border-default rounded-2xl lg:p-6 space-y-4">
              <h4 class="text-base font-semibold text-primary-fg">Branch Details</h4>

              <div class="relative">
                <input id="ifscCode" type="text" formControlName="ifscCode" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm uppercase tracking-widest text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="ifscCode" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  IFSC Code <span class="text-red-400">*</span>
                </label>
              </div>

              <div class="relative">
                <input id="branch" type="text" formControlName="branch" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="branch" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  Branch Name
                </label>
              </div>

              <div class="relative">
                <input id="accountType" type="text" formControlName="accountType" placeholder=" "
                  class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20" />
                <label for="accountType" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                  Account Type (Savings / Current)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button type="submit" [disabled]="isSaving()"
            class="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2">
            @if (isSaving()) {
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            {{ isSaving() ? 'Saving...' : 'Save Bank Details' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class BankAccountComponent {
  private readonly fb = inject(FormBuilder);

  readonly isSaving = signal(false);
  readonly saveSuccess = signal(false);

  readonly form = this.fb.nonNullable.group({
    bankName: ['', Validators.required],
    accountHolder: ['', Validators.required],
    accountNumber: ['', Validators.required],
    confirmAccount: ['', Validators.required],
    ifscCode: ['', Validators.required],
    branch: [''],
    accountType: [''],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.saveSuccess.set(false);

    // TODO: Call API to save bank details
    setTimeout(() => {
      this.isSaving.set(false);
      this.saveSuccess.set(true);
    }, 1000);
  }
}
