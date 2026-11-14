import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '@org/api-services';
import { NumberOnlyDirective } from '@org/directives';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, tap } from 'rxjs';

export interface AddressLookupItem {
  countryName: string;
  stateName: string;
  cityName: string;
  pincode: string;
}

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, NumberOnlyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [formGroup]="formGroup" class="grid grid-cols-1 gap-4 sm:grid-cols-2">

      <!-- Address Line 1 -->
      <div class="relative sm:col-span-2">
        <input
          id="addressLine1"
          type="text"
          formControlName="addressLine1"
          placeholder=" "
          class="peer block w-full appearance-none rounded-xl border px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:outline-none focus:ring-2"
          [ngClass]="formGroup.get('addressLine1')?.touched && formGroup.get('addressLine1')?.invalid
            ? 'border-red-400 bg-red-500/5 focus:border-red-400 focus:ring-red-400/20'
            : 'border-default bg-surface focus:border-[#66B42A] focus:ring-[#66B42A]/20'"
        />
        <label
          for="addressLine1"
          class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]"
        >
          Address Line 1 <span class="text-red-400">*</span>
        </label>
        @if (formGroup.get('addressLine1')?.touched && formGroup.get('addressLine1')?.errors?.['required']) {
          <p class="mt-1.5 flex items-center gap-1 text-xs text-red-500">
            <svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Address Line 1 is required.
          </p>
        }
      </div>

      <!-- Address Line 2 -->
      <div class="relative sm:col-span-2">
        <input
          id="addressLine2"
          type="text"
          formControlName="addressLine2"
          placeholder=" "
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
        />
        <label
          for="addressLine2"
          class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]"
        >
          Address Line 2
        </label>
      </div>

      <!-- Postal Code -->
      <div class="relative">
        <input
          id="postalCode"
          type="text"
          maxlength="6"
          formControlName="postalCode"
          placeholder=" "
          appNumberOnly
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm tracking-widest text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
        />
        <label
          for="postalCode"
          class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-[#66B42A]"
        >
          Postal Code <span class="text-red-400">*</span>
        </label>
        @if (isPostalLookupPending) {
          <p class="mt-1 flex items-center gap-1 text-xs text-primary-fg/50">
            <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Fetching location...
          </p>
        }
        @if (formGroup.get('postalCode')?.touched && formGroup.get('postalCode')?.errors?.['required']) {
          <p class="mt-1.5 flex items-center gap-1 text-xs text-red-500">
            <svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Postal Code is required.
          </p>
        }
      </div>

      <!-- City (auto-filled from postal lookup) -->
      <div class="relative">
        <select
          id="city"
          formControlName="city"
          [value]="formGroup.get('city')?.value"
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
        >
          <option value="" disabled>Select City</option>
          @for (city of cityList; track city) {
            <option [value]="city">{{ city }}</option>
          }
        </select>
        <label
          for="city"
          class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50"
        >
          City <span class="text-red-400">*</span>
        </label>
        @if (formGroup.get('city')?.touched && formGroup.get('city')?.errors?.['required']) {
          <p class="mt-1.5 flex items-center gap-1 text-xs text-red-500">
            <svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            City is required.
          </p>
        }
      </div>

      <!-- Country (auto-filled from postal lookup) -->
      <div class="relative">
        <input
          id="country"
          type="text"
          formControlName="country"
          placeholder=" "
          readonly
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg/50 transition-colors focus:outline-none"
        />
        <label
          for="country"
          class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-placeholder-shown:text-primary-fg/50"
        >
          Country <span class="text-red-400">*</span>
        </label>
      </div>

      <!-- State (auto-filled from postal lookup) -->
      <div class="relative">
        <select
          id="state"
          formControlName="state"
          [value]="formGroup.get('state')?.value"
          class="peer block w-full appearance-none rounded-xl border border-default bg-surface px-4 pb-2.5 pt-5 text-sm text-primary-fg transition-colors focus:border-[#66B42A] focus:outline-none focus:ring-2 focus:ring-[#66B42A]/20"
        >
          <option value="" disabled>Select State</option>
          @for (state of stateList; track state) {
            <option [value]="state">{{ state }}</option>
          }
        </select>
        <label
          for="state"
          class="pointer-events-none absolute left-4 top-1 z-10 origin-[0] scale-75 text-xs text-primary-fg/50"
        >
          State <span class="text-red-400">*</span>
        </label>
      </div>

    </div>
  `,
})
export class AddressFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);

  @Input({ required: true }) formGroup!: FormGroup;

  cityList: string[] = [];
  stateList: string[] = [];
  isPostalLookupPending = false;

  ngOnInit(): void {
    this.setupPostalLookup();
  }

  private setupPostalLookup(): void {
    const postalCodeControl = this.formGroup.get('postalCode');
    if (!postalCodeControl) return;

    postalCodeControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((value) => {
          const normalized = (value ?? '').toString().trim();
          if (normalized !== value) {
            postalCodeControl.setValue(normalized, { emitEvent: false });
          }
          if (normalized.length !== 6) {
            this.clearLocationState();
          }
        }),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const postalCode = (value ?? '').toString().trim();
          if (postalCode.length !== 6) return of<AddressLookupItem[]>([]);

          this.isPostalLookupPending = true;
          return this.api
            .get<AddressLookupItem[]>('/locations/addresses', { pinCode: postalCode })
            .pipe(
              catchError(() => of<AddressLookupItem[]>([])),
              finalize(() => {
                this.isPostalLookupPending = false;
              })
            );
        })
      )
      .subscribe((locations) => {
        if (!locations?.length) {
          this.clearLocationState();
          return;
        }

        this.stateList = Array.from(new Set(locations.map((item) => item.stateName).filter(Boolean)));
        this.cityList = Array.from(new Set(locations.map((item) => item.cityName).filter(Boolean)));

        if (this.stateList.length) {
          this.formGroup.get('state')?.setValue(this.stateList[0]);
        }
        if (this.cityList.length) {
          this.formGroup.get('city')?.setValue(this.cityList[0]);
        }

        const country = locations[0]?.countryName ?? '';
        this.formGroup.get('country')?.setValue(country);
      });
  }

  private clearLocationState(): void {
    this.isPostalLookupPending = false;
    this.cityList = [];
    this.stateList = [];
  }
}
