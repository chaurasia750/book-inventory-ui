import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MemberProfile, MemberProfileService, UpdateProfilePayload } from '@org/api-services';
import { take } from 'rxjs';

@Component({
  selector: 'app-member-settings',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-settings.component.html',
})
export class MemberSettingsComponent implements OnInit {
  isLoading = true;
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
    this.memberProfileService.getProfileByMemberId(this.getMemberIdFromUrl()).pipe(take(1)).subscribe({
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

  private getMemberIdFromUrl(): string {
    const segments = window.location.pathname.split('/');
    const membersIdx = segments.indexOf('members');
    return membersIdx >= 0 && segments[membersIdx + 1] ? segments[membersIdx + 1] : '';
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
      userName: this.profile?.userName ?? null,
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
