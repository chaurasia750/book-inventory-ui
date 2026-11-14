import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface MemberProfileAddress {
  houseNo: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  districtId: number | null;
}

export interface SponsorDetails {
  title: string | null;
  fName: string | null;
  lName: string | null;
  loginId: string | null;
  primaryContactNumber: string | null;
  profileImage: string | number | null;
}

export interface UpdateProfilePayload {
  memberId: number;
  userName?: string | null;
  title: string;
  firstName: string;
  lastName: string;
  gender: number;
  primaryContactNumber: string;
  emailId: string;
  aadhaarNo: string;
  panCard: string;
  address: {
    houseNo: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface MemberProfile {
  id: number;
  memberId: string | null;
  registrationNumber: string | null;
  registrationDate: string | null;
  loginId: string | null;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  primaryContactNumber: string | null;
  secondaryContactNumber: string | null;
  emailId: string | null;
  aadhaarNo: string | null;
  panCard: string | null;
  introRegNo: string | null;
  introSide: string | null;
  franchiseName: string | null;
  sponsorDetails: SponsorDetails | null;
  address: MemberProfileAddress | null;
  profileImage: string | number | null;
  userName: string | null;
}

@Injectable({ providedIn: 'root' })
export class MemberProfileService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<MemberProfile> {
    return this.api
      .get<unknown>('/members/profile')
      .pipe(map((response) => this.normalizeProfileResponse(response)));
  }

  getProfileByMemberId(memberId: string): Observable<MemberProfile> {
    return this.api
      .get<unknown>(`/members/${memberId}/profile`)
      .pipe(map((response) => this.normalizeProfileResponse(response)));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<{ success: boolean }> {
    return this.api.put<{ success: boolean }>('/members/update-profile', payload);
  }

  updateProfileImage(fileId: number): Observable<{ success: boolean }> {
    return this.api.put<{ success: boolean }>(`/members/profile-image/${fileId}`, undefined);
  }

  private normalizeProfileResponse(response: unknown): MemberProfile {
    const root = this.asObject(response);
    const payload = this.asObject(
      root.data ?? root.profile ?? root.memberProfile ?? root.member ?? root,
    );
    const address = this.asObject(payload.address ?? payload.memberAddress ?? null);
    const sponsorRaw = this.asObject(payload.sponsorDetails ?? null);

    const sponsorDetails = this.isEmptyObject(sponsorRaw)
      ? null
      : {
          title: this.toString(sponsorRaw.title),
          fName: this.toString(sponsorRaw.fName ?? sponsorRaw.firstName ?? sponsorRaw.first_name),
          lName: this.toString(sponsorRaw.lName ?? sponsorRaw.lastName ?? sponsorRaw.last_name),
          loginId: this.toString(
            sponsorRaw.loginId ?? sponsorRaw.login_id ?? sponsorRaw.username,
          ),
          primaryContactNumber: this.toString(
            sponsorRaw.primaryContactNumber ?? sponsorRaw.primary_contact_number ?? sponsorRaw.mobile,
          ),
          profileImage: sponsorRaw.profileImage ?? sponsorRaw.profile_image ?? null,
        };

    return {
      id: this.toNumber(payload.id) ?? 0,
      memberId: this.toString(payload.memberId ?? payload.member_id),
      registrationNumber: this.toString(
        payload.registrationNumber ?? payload.registration_no,
      ),
      registrationDate: this.toString(
        payload.registrationDate ?? payload.registration_date,
      ),
      loginId: this.toString(payload.loginId ?? payload.login_id ?? payload.username),
      title: this.toString(payload.title),
      firstName: this.toString(payload.firstName ?? payload.first_name),
      lastName: this.toString(payload.lastName ?? payload.last_name),
      dateOfBirth: this.toString(
        payload.dateOfBirth ?? payload.date_of_birth ?? payload.dob,
      ),
      gender: this.toString(payload.gender),
      primaryContactNumber: this.toString(
        payload.primaryContactNumber ?? payload.primary_contact_number ?? payload.mobile,
      ),
      secondaryContactNumber: this.toString(
        payload.secondaryContactNumber ?? payload.secondary_contact_number ?? payload.altMobile,
      ),
      emailId: this.toString(payload.emailId ?? payload.email_id ?? payload.email),
      aadhaarNo: this.toString(payload.aadhaarNo ?? payload.aadharNo ?? payload.adharNo),
      panCard: this.toString(payload.memPan ?? payload.panCard ?? payload.pan),
      introRegNo: this.toString(payload.introRegNo ?? payload.intro_reg_no),
      introSide: this.toString(payload.introSide ?? payload.intro_side),
      franchiseName: this.toString(
        payload.franchiseName ?? payload.franchise_name ?? payload.userName ?? payload.username,
      ),
      sponsorDetails,
      address: this.isEmptyObject(address)
        ? null
        : {
            houseNo: this.toString(address.houseNo ?? address.house_no),
            street: this.toString(
              address.street ?? address.addressLine1 ?? address.address_line_1,
            ),
            city: this.toString(address.city ?? address.cityName),
            state: this.toString(address.state ?? address.stateName),
            zipCode: this.toString(
              address.zipCode ?? address.zip_code ?? address.pinCode,
            ),
            countryId: this.toNumber(address.countryId ?? address.country_id),
            stateId: this.toNumber(address.stateId ?? address.state_id),
            cityId: this.toNumber(address.cityId ?? address.city_id),
            districtId: this.toNumber(address.districtId ?? address.district_id),
          },
      profileImage: payload.profileImage ?? payload.profile_image ?? null,
      userName: this.toString(payload.userName ?? payload.username ?? payload.loginId ?? payload.login_id),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private asObject(value: unknown): any {
    return value && typeof value === 'object' ? value : {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isEmptyObject(value: any): boolean {
    return Object.keys(value).length === 0;
  }

  private toString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
