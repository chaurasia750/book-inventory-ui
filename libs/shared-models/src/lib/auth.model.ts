/**
 * The four fixed roles, exactly as the API sends them in tokens and responses.
 * (The legacy `Role` type in user.model.ts is the older `admin` | `member` bucket that existing pages still use;
 * `AuthService.roles()` maps these real roles onto it.)
 */
export const APP_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SALES_CRM: 'SALES_CRM',
  ACCOUNTS: 'ACCOUNTS',
  MEMBER: 'MEMBER',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/** Roles that work in the admin app. */
export const STAFF_ROLES: readonly AppRole[] = [APP_ROLES.SUPER_ADMIN, APP_ROLES.SALES_CRM, APP_ROLES.ACCOUNTS];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (Object.values(APP_ROLES) as string[]).includes(value);
}

export function isStaffRole(role: AppRole | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

/** The signed-in user as returned by `POST auth/login`, `POST auth/refresh` and `GET auth/me`. */
export interface AuthUser {
  id: string;
  userName: string;
  fullName: string;
  email: string | null;
  mobile?: string | null;
  role: AppRole;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
}

export interface LoginRequest {
  /** Agents use their generated user id; staff use their email or username. */
  identifier: string;
  password: string;
  rememberMe: boolean;
}

/** Response of login and refresh. The access token lives in memory only. */
export interface AuthTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

/** What happens after an agent registers (`Registration:Mode`): waits for approval, or is signed in at once. */
export type RegistrationOutcome = 'PENDING_APPROVAL' | 'SIGNED_IN';

/** The answer of the registration endpoint (owned by the mlm module): the outcome, plus the sign-in for an instant login. */
export interface MemberRegistrationResponse {
  outcome: RegistrationOutcome;
  userId: string;
  messageCode: string | null;
  signIn: AuthTokenResponse | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
}
