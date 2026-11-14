export enum RoleId {
  SYSTEM_ADMIN = 1,
  ADMIN = 2,
  MEMBER = 3,
  MANAGER = 4,
}

export type ValidRoleId = RoleId.SYSTEM_ADMIN | RoleId.ADMIN | RoleId.MEMBER | RoleId.MANAGER;

export function isValidRole(role: unknown): role is ValidRoleId {
  return [1, 2, 3, 4].includes(role as number);
}

// Lazy import to avoid circular dependency — APP_URLS lives in @org/constants
// which may import from @org/shared-models.  Resolved at call-time.
import { APP_URLS } from '@org/constants';
export const roleRouteMap: Record<ValidRoleId, string> = {
  [RoleId.SYSTEM_ADMIN]: APP_URLS.ADMIN,
  [RoleId.ADMIN]: APP_URLS.ADMIN,
  [RoleId.MEMBER]: APP_URLS.MEMBER,
  [RoleId.MANAGER]: APP_URLS.MEMBER,
};
