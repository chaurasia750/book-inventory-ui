import { AppRole } from './auth.model';

/** The account statuses of the iam API (`UPPER_SNAKE` on the wire). */
export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REJECTED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Roles a Super Admin can assign to staff (never `MEMBER`). */
export const STAFF_ASSIGNABLE_ROLES: readonly AppRole[] = ['SUPER_ADMIN', 'SALES_CRM', 'ACCOUNTS'];

export interface PagedList<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** One row of `GET users`. */
export interface UserSummary {
  id: string;
  userName: string;
  fullName: string;
  email: string | null;
  mobile: string | null;
  role: AppRole;
  status: AccountStatus;
  isLocked: boolean;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** `GET users/{id}`. */
export interface UserDetail extends UserSummary {
  statusReason: string | null;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  suspendedUntil: string | null;
  failedLoginCount: number;
  passwordChangedAt: string | null;
  updatedAt: string | null;
}

export interface UserSearchParams {
  search?: string;
  role?: AppRole;
  status?: AccountStatus;
  isLocked?: boolean;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

export interface CreateStaffRequest {
  fullName: string;
  userName: string;
  email: string;
  mobile?: string;
  role: AppRole;
}

/** The temporary password is in this answer once and can never be fetched again. */
export interface CreatedStaff {
  id: string;
  userName: string;
  fullName: string;
  email: string | null;
  mobile: string | null;
  role: AppRole;
  status: AccountStatus;
  mustChangePassword: boolean;
  temporaryPassword: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email?: string;
  mobile?: string;
}

export interface StatusChangeRequest {
  reason?: string;
  suspendedUntil?: string;
}

export interface ChangeRoleRequest {
  role: AppRole;
  reason: string;
}

export interface UserStatusHistoryItem {
  id: string;
  fromStatus: AccountStatus;
  toStatus: AccountStatus;
  reason: string;
  until: string | null;
  changedBy: string | null;
  /** Null for SYSTEM (the automatic lift) and for the hidden system account. */
  changedByName: string | null;
  changedAt: string;
}

export interface UserSessionItem {
  id: string;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}
