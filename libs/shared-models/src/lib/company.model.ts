import { AccountStatus, UserSummary } from './user-admin.model';

/** The company statuses of the company API (`UPPER_SNAKE` on the wire). */
export const COMPANY_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

/** One row of `GET companies`. */
export interface CompanySummary {
  id: string;
  name: string;
  state: string | null;
  status: CompanyStatus;
  createdAt: string;
}

export interface CompanySearchParams {
  search?: string;
  status?: CompanyStatus;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

/** One row of a company's status timeline; `from` is null on the creation row. */
export interface CompanyStatusEntry {
  from: CompanyStatus | null;
  to: CompanyStatus;
  reason: string;
  changedBy: string | null;
  changedAt: string;
}

/** `GET companies/{id}`: master data, status, timeline and the company's accounts. */
export interface CompanyDetail {
  id: string;
  name: string;
  address: string | null;
  mobile: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  state: string | null;
  tagline: string | null;
  status: CompanyStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  createdAt: string;
  history: CompanyStatusEntry[];
  accounts: UserSummary[];
}

/** The master data a Super Admin may write. */
export interface CompanyFields {
  name: string;
  address?: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  state?: string;
  tagline?: string;
}

export interface CreateCompanyRequest extends CompanyFields {
  owner: { fullName: string };
}

/** The Owner's login: shown once, the password can never be fetched again. */
export interface CompanyOwnerCredentials {
  userId: string;
  userName: string;
  temporaryPassword: string;
}

export interface CreatedCompany {
  id: string;
  name: string;
  status: CompanyStatus;
  owner: CompanyOwnerCredentials;
}

/** `GET companies/current`: the company of this session. */
export interface CurrentCompany {
  id: string;
  name: string;
  /** The company's address segment (company spec R15): its screens live at `/<slug>/...`. */
  slug: string;
  status: CompanyStatus;
  state: string | null;
}

/** `GET companies/current`: the company of the session, or null for a Super Admin who has not entered one (company spec R10). */
export interface CurrentCompanyView {
  company: CurrentCompany | null;
}

/** The answer of entering or leaving a company; the new access cookie is set by the same response. */
export interface SessionCompanyResponse {
  company: CurrentCompany | null;
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface AddStaffRequest {
  fullName: string;
  shortName: string;
}

/** The Staff login: shown once, the password can never be fetched again. */
export interface CreatedCompanyStaff {
  id: string;
  userName: string;
  fullName: string;
  temporaryPassword: string;
}

export interface TemporaryPasswordResponse {
  userId: string;
  userName: string;
  temporaryPassword: string;
}

/** Account statuses are shared with the user list. */
export type StaffStatus = AccountStatus;
