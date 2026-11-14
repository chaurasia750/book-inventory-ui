import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, tap } from 'rxjs';
import { ApiService, RegisterMemberPayload, RegisterMemberResponse, SponsorValidationResponse } from '@org/api-services';
import { TitleSelectComponent } from '@org/ui';
import { PhoneFormatDirective, PanCardDirective } from '@org/directives';
import { AuthService } from '@org/auth';
import { APP_URLS } from '@org/constants';
import { AddressFormComponent } from '../address-form/address-form';

@Component({
  selector: 'app-sponsor-registration',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, AddressFormComponent, TitleSelectComponent, PhoneFormatDirective, PanCardDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sponsor-registration.html',
})
export class SponsorRegistrationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  @Input() hideSponsorId = false;
  @Input() presetSponsorId = '';
  @Input() submitButtonText = '';
  @Input() submitLoadingText = '';
  /** Only set this on the public self-signup form — logs the newly-registered member into the
   *  current browser session. Leave false when an already-authenticated admin/member uses this
   *  form to register someone else, or their own session would be replaced by the new member's. */
  @Input() autoLoginOnSuccess = false;
  @Output() registered = new EventEmitter<string>();

  sponsorPrefix = 'ABZ';
  sponsorLookupName = '';
  isSponsorLookupPending = false;
  isLoading = false;
  isSuccess = false;
  registrationNumber = '';
  sponsorRegNo: number | null = null;

  readonly signupForm = this.fb.group({
    title: ['', [Validators.required]],
    firstName: ['', [Validators.required, Validators.pattern(/^\S+$/)]],
    lastName: ['', [Validators.required, Validators.pattern(/^\S+$/)]],
    gender: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{4} \d{4} \d{2}$/)]],
    aadhaarNo: [''],
    panCard: [''],
    sponsorId: [''],
    franchiseName: [''],
    address: this.fb.group({
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      country: [{ value: 'India', disabled: true }, [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
    }),
  });

  constructor() {
    this.setupSponsorValidation();
  }

  ngOnInit() {
    if (this.hideSponsorId && this.presetSponsorId) {
      this.sponsorRegNo = Number(this.presetSponsorId) || null;
      this.signupForm.get('sponsorId')?.setValue(this.presetSponsorId);
      this.signupForm.get('sponsorId')?.disable();
    }
  }

  get addressGroup() {
    return this.signupForm.controls.address;
  }

  isInvalid(controlName: string): boolean {
    const control: AbstractControl | null = this.signupForm.get(controlName);
    return !!(control?.touched && control?.invalid);
  }

  getError(controlName: string): string {
    const control: AbstractControl | null = this.signupForm.get(controlName);
    if (!control?.touched || !control?.errors) return '';
    if (control.errors['required']) {
      const fieldNames: Record<string, string> = {
        title: 'Title',
        firstName: 'First Name',
        lastName: 'Last Name',
        gender: 'Gender',
        email: 'Email',
        phone: 'Phone',
        aadhaarNo: 'Aadhaar Number',
        panCard: 'PAN Card',
        sponsorId: 'Sponsor ID',
      };
      const fieldName = fieldNames[controlName] || controlName;
      return `${fieldName} is required.`;
    }
    if (controlName === 'title') return 'Please select a title.';
    if (controlName === 'gender') return 'Please select gender.';
    if (control.errors['email']) return 'Enter a valid email address.';
    if (control.errors['pattern']) {
      if (controlName === 'firstName' || controlName === 'lastName') return 'Name cannot contain spaces.';
      if (controlName === 'phone') return 'Enter a valid 10-digit mobile number.';
    }
    if (control.errors['invalidSponsor']) return 'Sponsor ID was not found.';
    if (control.errors['minlength'] || control.errors['maxlength'])
      return 'Sponsor ID must be exactly 6 characters.';
    return 'Invalid input.';
  }

  onFirstNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (upper !== input.value) {
      this.signupForm.get('firstName')?.setValue(upper, { emitEvent: false });
    }
  }

  private setupSponsorValidation(): void {
    const sponsorIdControl = this.signupForm.get('sponsorId');
    if (!sponsorIdControl) return;

    sponsorIdControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((rawValue) => {
          const value = (rawValue ?? '').toString().trim().toUpperCase();
          if (value !== rawValue) {
            sponsorIdControl.setValue(value, { emitEvent: false });
          }
          this.sponsorLookupName = '';
          this.isSponsorLookupPending = false;
          this.clearSponsorLookupError();
        }),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(() => {
          const currentRaw = (sponsorIdControl.value ?? '').toString().trim();
          if (!currentRaw || this.hideSponsorId) return of(null);
          this.isSponsorLookupPending = true;
          const fullSponsorId = this.getFullSponsorId();
          return this.api
            .get<SponsorValidationResponse>(
              `/registration-validation/sponser?sponsonrId=${encodeURIComponent(fullSponsorId)}`
            )
            .pipe(
              tap((response) => {
                this.sponsorRegNo = response?.intoRegNo ?? null;
                this.sponsorLookupName = [response?.title, response?.fName, response?.lName]
                  .filter((part): part is string => !!part)
                  .join(' ')
                  .trim();
                if (!this.sponsorLookupName) this.setSponsorLookupError();
              }),
              catchError(() => {
                this.setSponsorLookupError();
                return of(null);
              }),
              finalize(() => {
                this.isSponsorLookupPending = false;
              }),
            );
        }),
      )
      .subscribe();
  }

  private getFullSponsorId(): string {
    const suffix = (this.signupForm.get('sponsorId')?.value ?? '').toString().trim().toUpperCase();
    return `${this.sponsorPrefix}${suffix}`;
  }

  private setSponsorLookupError(): void {
    const sponsorIdControl = this.signupForm.get('sponsorId');
    if (!sponsorIdControl) return;
    sponsorIdControl.setErrors({
      ...(sponsorIdControl.errors ?? {}),
      invalidSponsor: true,
    });
  }

  private clearSponsorLookupError(): void {
    const sponsorIdControl = this.signupForm.get('sponsorId');
    if (!sponsorIdControl?.errors?.['invalidSponsor']) return;
    const { invalidSponsor: _, ...remainingErrors } = sponsorIdControl.errors;
    sponsorIdControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
  }

  submit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      const addressGroup = this.signupForm.get('address') as FormGroup;
      if (addressGroup) {
        Object.keys(addressGroup.controls).forEach((key) => {
          addressGroup.controls[key]?.markAsTouched();
        });
      }
      return;
    }

    this.isLoading = true;
    const formValue = this.signupForm.getRawValue();
    const addressValue = formValue.address;

    const payload: RegisterMemberPayload = {
      bussinessCategoryId: 0,
      introRegNo: this.sponsorRegNo ?? (formValue.sponsorId ? Number(formValue.sponsorId) : 0),
      personInfo: {
        userName: formValue.franchiseName ?? '',
        title: formValue.title ?? '',
        firstName: formValue.firstName ?? '',
        lastName: formValue.lastName ?? '',
        gender: formValue.gender === 'male' ? 1 : 2,
        primaryContactNumber: (formValue.phone ?? '').replace(/\s/g, ''),
        aadhaarNo: (formValue.aadhaarNo ?? '').replace(/\s/g, ''),
        panCard: formValue.panCard ?? '',
        emailId: formValue.email ?? '',
      },
      address: {
        houseNo: addressValue?.addressLine1 ?? '',
        street: addressValue?.addressLine2 || '',
        city: addressValue?.city ?? '',
        state: addressValue?.state ?? '',
        countryId: 0,
        stateId: 0,
        cityId: 0,
        zipCode: addressValue?.postalCode ?? '',
        distId: 0,
      },
      introSide: 'L',
    };

    this.api
      .post<RegisterMemberResponse>('/members/registration', payload, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.registrationNumber = response?.registrationNumber ?? '';
          this.registered.emit(this.registrationNumber);

          if (this.autoLoginOnSuccess && response?.token?.accessToken) {
            this.authService.establishSessionFromRegistration().subscribe({
              next: () => (window.location.href = APP_URLS.MEMBER),
              error: () => this.finishAsSuccess(),
            });
            return;
          }

          this.finishAsSuccess();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private finishAsSuccess(): void {
    this.isSuccess = true;
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}