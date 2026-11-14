import { AccountStatus, CompanyStatus, DeviceType, LoginResult } from '@org/shared-models';

// Avatar initials reuse the existing `initials` of ./string.util (exported from the same index) rather than a second
// implementation of the same rule.

const AVATAR_PALETTE = [
  'bg-brand-100 text-brand-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

/** A stable avatar colour for a given id/name, so the same user always gets the same colour. */
export function avatarColorClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

const ACCOUNT_STATUS_BADGE: Record<AccountStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-700',
};

/** The colour a Super Admin screen shows an account status in (spec R28's five statuses). */
export function accountStatusBadgeClass(status: AccountStatus): string {
  return ACCOUNT_STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600';
}

/** The colour a company status is shown in (company R7: active or inactive). */
export function companyStatusBadgeClass(status: CompanyStatus): string {
  return status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
}

/** The colour a login attempt's result is shown in: green for a success, red for every refusal. */
export function loginResultBadgeClass(result: LoginResult): string {
  return result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
}

const DEVICE_ICON_PATH: Record<DeviceType, string> = {
  DESKTOP: 'M4 5h16v10H4zM2 19h20M9 19v-4h6v4',
  MOBILE: 'M8 3h8v18H8zM10.5 18h3',
  TABLET: 'M5 3h14v18H5zM11 18h2',
  BOT: 'M12 3v3M8 8h8v9a2 2 0 01-2 2H10a2 2 0 01-2-2zM9 12h.01M15 12h.01',
  UNKNOWN: 'M12 18h.01M9.5 9a2.5 2.5 0 115 .5c0 1.5-2 2-2 3.5',
};

/** The outline-icon path for a device type, used next to the browser/OS text on a session or login row. */
export function deviceIconPath(deviceType: DeviceType | null | undefined): string {
  return DEVICE_ICON_PATH[deviceType ?? 'UNKNOWN'] ?? DEVICE_ICON_PATH.UNKNOWN;
}
