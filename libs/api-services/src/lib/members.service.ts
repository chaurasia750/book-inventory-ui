import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Kit {
  id: number;
  kitCode: string;
  kitPrice: number;
  kitDesc: string;
  kitProducts?: string;
  kitBV?: number;
  kitPV?: number;
}

export interface CompanyBankAccount {
  id: number;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  ifsccode: string;
  branchName: string;
  address: string;
  paymentTypeId: number;
  upiId: string;
}

export interface SponsorValidationResponse {
  intoRegNo: number;
  title: string | null;
  fName: string | null;
  lName: string | null;
  franchiseeId: number | null;
}

export interface RegisterMemberPayload {
  bussinessCategoryId: number;
  introRegNo: number;
  personInfo: {
    userName: string;
    title: string;
    firstName: string;
    lastName: string;
    gender: number;
    primaryContactNumber: string;
    aadhaarNo: string;
    panCard: string;
    emailId: string;
  };
  address: {
    houseNo: string;
    street: string;
    city: string;
    state: string;
    countryId: number;
    stateId: number;
    cityId: number;
    zipCode: string;
    distId: number;
  };
  introSide: string;
}

export interface RegisterMemberResponse {
  registrationNumber: string;
  token?: {
    accessToken: string;
  } | null;
}

export interface Member {
  id: number;
  name: string;
  regNo: string;
  franchiseName: string;
  memberId: string;
  joiningDate: string;
  mobileNo: string;
  email: string;
  referralMember: string;
  referralRegNo: string;
  referralMemberId: number;
  status: number;
  isAcountActive: boolean;
  profileImage?: string | number | null;
}

export interface MemberListResponse {
  indexFrom: number;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items: Member[];
}

export interface MemberLoginDetails {
  id: number;
  loginId: string;
  firstName: string;
  lastName: string;
  password: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly api = inject(ApiService);

  getMembers(params?: Record<string, string | number | boolean>): Observable<MemberListResponse> {
    return this.api.get<MemberListResponse>('/members/list', params);
  }

  getKits(): Observable<unknown> {
    return this.api.get<unknown>('/members/kits');
  }

  getCompanyBankAccounts(): Observable<unknown> {
    return this.api.get<unknown>('/master/company-bank-account');
  }

  validateSponsor(sponsorId: string): Observable<SponsorValidationResponse> {
    return this.api.get<SponsorValidationResponse>(`/registration-validation/sponser?sponsonrId=${encodeURIComponent(sponsorId)}`);
  }

  registerMember(payload: RegisterMemberPayload): Observable<RegisterMemberResponse> {
    return this.api.post<RegisterMemberResponse>('/members/registration', payload, { withCredentials: true });
  }

  activateMember(userName: string): Observable<unknown> {
    return this.api.put<unknown>(`/users/${encodeURIComponent(userName)}/status?active=true`, {});
  }

  deactivateMember(userName: string): Observable<unknown> {
    return this.api.put<unknown>(`/users/${encodeURIComponent(userName)}/status?active=false`, {});
  }

  getMemberLoginDetails(id: number): Observable<MemberLoginDetails> {
    return this.api.get<MemberLoginDetails>(`/members/${id}/login-details`);
  }
}
