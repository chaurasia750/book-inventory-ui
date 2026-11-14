import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MemberProfile, MemberProfileService, UpdateProfilePayload } from '@org/api-services';
import { take } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading) {
      <div class="rounded-2xl border border-default bg-surface p-5 lg:p-6">
        <div class="animate-pulse space-y-6">
          <div class="h-7 w-40 bg-default rounded"></div>
          <div class="grid grid-cols-12 gap-4 md:gap-6">
            <div class="col-span-12 lg:col-span-6">
              <div class="p-5 border border-default rounded-2xl lg:p-6 space-y-4">
                <div class="h-6 w-36 bg-default rounded"></div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="h-10 bg-default rounded"></div>
                  <div class="h-10 bg-default rounded"></div>
                  <div class="h-10 bg-default rounded"></div>
                  <div class="h-10 bg-default rounded"></div>
                </div>
              </div>
            </div>
            <div class="col-span-12 lg:col-span-6">
              <div class="p-5 border border-default rounded-2xl lg:p-6 space-y-4">
                <div class="h-6 w-36 bg-default rounded"></div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="h-10 bg-default rounded"></div>
                  <div class="h-10 bg-default rounded"></div>
                  <div class="h-10 bg-default rounded"></div>
                  <div class="h-10 bg-default rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="rounded-2xl border border-default bg-surface p-5 lg:p-6">
        <h3 class="mb-5 text-lg font-semibold text-primary-fg lg:mb-7">Edit Profile</h3>

        <form [formGroup]="editForm" (ngSubmit)="submit()" class="space-y-6" novalidate>
          @if (updateSuccess) {
            <div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-500/10">
              <svg class="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              <p class="text-sm font-medium text-emerald-800 dark:text-emerald-300">Profile updated successfully!</p>
            </div>
          }

          @if (updateError) {
            <div class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-500/10">
              <svg class="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ updateError }}</p>
            </div>
          }

          <div class="grid grid-cols-12 gap-4 md:gap-6">
            <!-- PERSONAL DETAILS -->
            <div class="col-span-12 lg:col-span-6">
              <div class="p-5 border border-default rounded-2xl lg:p-6">
                <h4 class="text-lg font-semibold text-primary-fg mb-6">Personal Details</h4>
                <div class="space-y-4">
                  <!-- Title + First Name | Last Name -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr] items-start">
                    <div class="flex flex-row rounded-xl border border-default bg-surface focus-within:border-[#66B42A] focus-within:ring-2 focus-within:ring-[#66B42A]/20">
                      <div class="shrink-0 w-20">
                        <select [formControl]="$any(editForm.get('title'))" class="h-full w-full cursor-pointer appearance-none bg-surface px-3 py-3 text-sm text-primary-fg focus:outline-none">
                          <option value="" disabled>Title</option>
                          @for (title of titleOptions; track title) {
                            <option [value]="title">{{ title }}</option>
                          }
                        </select>
                      </div>
                      <div class="w-px self-stretch bg-default"></div>
                      <div class="relative min-w-0 flex-1">
                        <input id="editFirstName" type="text" formControlName="firstName" placeholder=" "
                          class="peer block w-full border-0 bg-transparent px-4 pb-2.5 pt-5 text-sm text-primary-fg placeholder:text-muted-fg focus:outline-none"
                        />
                        <label for="editFirstName" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                          First Name <span class="text-red-400">*</span>
                        </label>
                      </div>
                    </div>
                    <div class="relative">
                      <input id="editLastName" type="text" formControlName="lastName" placeholder=" "
                        class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
                      />
                      <label for="editLastName" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                        Last Name <span class="text-red-400">*</span>
                      </label>
                    </div>
                  </div>

                  <!-- Gender -->
                  <div>
                    <p class="mb-2 text-xs font-medium text-primary-fg/50">Gender <span class="text-red-400">*</span></p>
                    <div class="grid grid-cols-2 gap-3">
                      @for (g of genderOptions; track g.value) {
                        <label class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors"
                          [ngClass]="editForm.get('gender')?.value === g.value
                            ? 'border-[#66B42A] bg-[#66B42A]/25 text-[#66B42A] font-semibold'
                            : 'border-default bg-surface text-primary-fg hover:border-[#66B42A] hover:bg-[#66B42A]/5 hover:text-[#66B42A]'"
                        >
                          <input type="radio" formControlName="gender" [value]="g.value" class="h-4 w-4 accent-[#66B42A]" />
                          {{ g.label }}
                        </label>
                      }
                    </div>
                  </div>

                  <!-- Email & Phone -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="relative">
                      <input id="editEmail" type="email" formControlName="email" placeholder=" "
                        class="peer block w-full appearance-none rounded-xl border px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:outline-none focus:ring-2"
                        [ngClass]="isInvalid('email') ? 'border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-400/20' : 'border-default bg-surface focus:border-[#66B42A] focus:ring-[#66B42A]/20'"
                      />
                      <label for="editEmail" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                        Email <span class="text-red-400">*</span>
                      </label>
                    </div>
                    <div>
                      <div class="relative">
                        <span class="pointer-events-none absolute left-4 top-5 bottom-2.5 z-10 flex items-center select-none text-sm font-semibold text-primary-fg/50">+91</span>
                        <input id="editPhone" type="text" maxlength="12" formControlName="phone" placeholder=" " (input)="onInputPhone($event)"
                          class="peer block w-full appearance-none rounded-xl border pl-12 pr-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:outline-none focus:ring-2"
                          [ngClass]="isInvalid('phone') ? 'border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-400/20' : 'border-default bg-surface focus:border-[#66B42A] focus:ring-[#66B42A]/20'"
                        />
                        <label for="editPhone" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-5 peer-placeholder-shown:left-12 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:left-4 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                          Phone <span class="text-red-400">*</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Aadhaar & PAN -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="relative">
                      <input id="editAadhaar" type="text" maxlength="14" formControlName="adharNo" placeholder=" "
                        class="peer block w-full appearance-none rounded-xl border px-4 pb-2.5 pt-5 text-sm tracking-widest text-primary-fg transition-colors focus:outline-none focus:ring-2"
                        [ngClass]="isInvalid('adharNo') ? 'border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-400/20' : 'border-default bg-surface focus:border-[#66B42A] focus:ring-[#66B42A]/20'"
                      />
                      <label for="editAadhaar" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                        Aadhaar Number
                      </label>
                    </div>
                    <div class="relative">
                      <input id="editPan" type="text" maxlength="10" formControlName="memPan" placeholder=" "
                        class="peer block w-full appearance-none rounded-xl border px-4 pb-2.5 pt-5 text-sm uppercase tracking-widest text-primary-fg transition-colors focus:outline-none focus:ring-2"
                        [ngClass]="isInvalid('memPan') ? 'border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-400/20' : 'border-default bg-surface focus:border-[#66B42A] focus:ring-[#66B42A]/20'"
                      />
                      <label for="editPan" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                        PAN Card
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ADDRESS DETAILS -->
            <div class="col-span-12 lg:col-span-6">
              <div class="p-5 border border-default rounded-2xl lg:p-6">
                <h4 class="text-lg font-semibold text-primary-fg mb-6">Address Details</h4>
                <div class="flex items-center gap-3 py-1 mb-4">
                  <div class="h-px flex-1 bg-default"></div>
                  <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-fg/50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Address
                  </span>
                  <div class="h-px flex-1 bg-default"></div>
                </div>
                <div [formGroup]="$any(editForm.get('address'))" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="relative sm:col-span-2">
                    <input id="addressLine1" type="text" formControlName="addressLine1" placeholder=" "
                      class="peer block w-full appearance-none rounded-xl border px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:outline-none focus:ring-2"
                      [ngClass]="isAddressInvalid('addressLine1') ? 'border-red-400 bg-red-500/5 focus:border-red-400 focus:ring-red-400/20' : 'border-default bg-surface focus:border-[#66B42A] focus:ring-[#66B42A]/20'"
                    />
                    <label for="addressLine1" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                      Address Line 1 <span class="text-red-400">*</span>
                    </label>
                  </div>
                  <div class="relative sm:col-span-2">
                    <input id="addressLine2" type="text" formControlName="addressLine2" placeholder=" "
                      class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
                    />
                    <label for="addressLine2" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                      Address Line 2
                    </label>
                  </div>
                  <div class="relative">
                    <input id="postalCode" type="text" maxlength="6" formControlName="postalCode" placeholder=" "
                      class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm tracking-widest text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
                    />
                    <label for="postalCode" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                      Postal Code <span class="text-red-400">*</span>
                    </label>
                  </div>
                  <div class="relative">
                    <input id="city" type="text" formControlName="city" placeholder=" "
                      class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
                    />
                    <label for="city" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                      City <span class="text-red-400">*</span>
                    </label>
                  </div>
                  <div class="relative">
                    <input id="country" type="text" value="India" readonly
                      class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg/50 transition-colors focus:outline-none"
                    />
                    <label for="country" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50">
                      Country <span class="text-red-400">*</span>
                    </label>
                  </div>
                  <div class="relative">
                    <input id="state" type="text" formControlName="state" placeholder=" "
                      class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
                    />
                    <label for="state" class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]">
                      State <span class="text-red-400">*</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <div class="flex justify-end pt-2">
            <button type="submit" [disabled]="isSaving"
              class="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              @if (isSaving) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              {{ isSaving ? 'Saving...' : 'Update Profile' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class EditProfileComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  updateSuccess = false;
  updateError = '';
  profile: MemberProfile | null = null;

  readonly titleOptions = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Er'];
  readonly genderOptions = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }];

  readonly editForm: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly memberProfileService = inject(MemberProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      adharNo: [''],
      memPan: [''],
      address: this.fb.group({
        addressLine1: ['', Validators.required],
        addressLine2: [''],
        postalCode: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
      }),
    });
  }

  ngOnInit(): void {
    this.memberProfileService.getProfile().pipe(take(1)).subscribe({
      next: (p) => {
        this.profile = p;
        this.populateForm(p);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private populateForm(profile: MemberProfile): void {
    const genderValue = profile.gender === '1' ? 'male' : profile.gender === '2' ? 'female' : '';
    const phoneRaw = (profile.primaryContactNumber ?? '').replace(/\D/g, '');
    const phone = phoneRaw.length === 10
      ? `${phoneRaw.slice(0, 4)} ${phoneRaw.slice(4, 8)} ${phoneRaw.slice(8)}`
      : '';
    const aadhaarRaw = (profile.aadhaarNo ?? '').replace(/\D/g, '');
    const aadhaar = aadhaarRaw.length === 12
      ? `${aadhaarRaw.slice(0, 4)} ${aadhaarRaw.slice(4, 8)} ${aadhaarRaw.slice(8)}`
      : '';

    this.editForm.patchValue({
      title: profile.title || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      gender: genderValue,
      email: profile.emailId || '',
      phone,
      adharNo: aadhaar,
      memPan: (profile.panCard ?? '').toUpperCase(),
    }, { emitEvent: false });

    const addr = profile.address;
    if (addr) {
      this.editForm.patchValue({
        address: {
          addressLine1: addr.houseNo || '',
          addressLine2: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.zipCode || '',
        },
      }, { emitEvent: false });
    }
  }

  onInputPhone(e: Event): void {
    const el = e.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').slice(0, 10);
    let v = d;
    if (d.length > 8) v = `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
    else if (d.length > 4) v = `${d.slice(0, 4)} ${d.slice(4)}`;
    el.value = v;
    this.editForm.get('phone')?.setValue(v, { emitEvent: false });
  }

  isInvalid(name: string): boolean {
    const c = this.editForm.get(name);
    return !!(c?.touched && c?.invalid);
  }

  isAddressInvalid(name: string): boolean {
    const addr = this.editForm.get('address') as FormGroup;
    const c = addr?.get(name);
    return !!(c?.touched && c?.invalid);
  }

  submit(): void {
    this.updateSuccess = false;
    this.updateError = '';

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      const ag = this.editForm.get('address') as FormGroup;
      if (ag) Object.keys(ag.controls).forEach(k => ag.controls[k]?.markAsTouched());
      return;
    }

    this.isSaving = true;
    const v = this.editForm.getRawValue();

    const payload: UpdateProfilePayload = {
      memberId: this.profile?.id ?? 0,
      title: v.title,
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender === 'male' ? 1 : 2,
      primaryContactNumber: (v.phone || '').replace(/\s/g, ''),
      emailId: v.email,
      aadhaarNo: (v.adharNo || '').replace(/\s/g, ''),
      panCard: v.memPan,
      address: {
        houseNo: v.address?.addressLine1 || '',
        street: v.address?.addressLine2 || '',
        city: v.address?.city || '',
        state: v.address?.state || '',
        zipCode: v.address?.postalCode || '',
      },
    };

    this.memberProfileService.updateProfile(payload).pipe(take(1)).subscribe({
      next: () => {
        this.isSaving = false;
        this.updateSuccess = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        this.updateError = err?.error?.message || 'Failed to update profile.';
        this.cdr.markForCheck();
      },
    });
  }
}
