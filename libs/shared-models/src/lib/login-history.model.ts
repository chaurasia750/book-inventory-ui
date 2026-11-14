import { AppRole } from './auth.model';

export type LoginResult =
  | 'SUCCESS'
  | 'FAILED_BAD_PASSWORD'
  | 'FAILED_UNKNOWN_USER'
  | 'FAILED_LOCKED'
  | 'FAILED_PENDING'
  | 'FAILED_INACTIVE'
  | 'FAILED_SUSPENDED'
  | 'FAILED_REJECTED';

export const LOGIN_RESULTS: readonly LoginResult[] = [
  'SUCCESS',
  'FAILED_BAD_PASSWORD',
  'FAILED_UNKNOWN_USER',
  'FAILED_LOCKED',
  'FAILED_PENDING',
  'FAILED_INACTIVE',
  'FAILED_SUSPENDED',
  'FAILED_REJECTED',
];

export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'BOT' | 'UNKNOWN';

export type LogoutReason =
  | 'USER_LOGOUT'
  | 'LOGOUT_ALL'
  | 'EXPIRED'
  | 'REVOKED_BY_ADMIN'
  | 'REVOKED_BY_USER'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_SUSPENDED'
  | 'FORCED_LOGOUT'
  | 'REFRESH_REUSE';

/** One active session of the caller (`GET auth/sessions`). */
export interface OwnSession {
  id: string;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  ipAddress: string | null;
  browserName: string | null;
  osName: string | null;
  deviceType: DeviceType | null;
  isCurrent: boolean;
}

/** One row of the caller's own login history (`GET auth/login-history`). */
export interface LoginHistoryItem {
  id: string;
  loginAt: string;
  result: LoginResult;
  ipAddress: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: DeviceType;
  loggedOutAt: string | null;
  logoutReason: LogoutReason | null;
  isNewDevice: boolean;
  isNewIp: boolean;
}

/** Who a log row is about; the hidden system account arrives as `isSystem` with no name and no id. */
export interface ActorLabel {
  userId: string | null;
  userName: string | null;
  isSystem: boolean;
}

/** One row of the Super Admin's login-log search. */
export interface LoginLogItem extends LoginHistoryItem {
  actor: ActorLabel;
  identifierAttempted: string;
  userAgent: string | null;
}

export interface LoginLogSearchParams {
  userId?: string;
  role?: AppRole;
  result?: LoginResult;
  ipAddress?: string;
  from?: string;
  to?: string;
  orderBy?: string;
  pageIndex: number;
  pageSize: number;
}

export interface UpdateOwnProfileRequest {
  fullName: string;
  email?: string;
  mobile?: string;
  currentPassword?: string;
}
