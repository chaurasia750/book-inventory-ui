import { AuthUser } from '@org/shared-models';

/** How the shell names the signed-in user: the header's user menu and the sidebar's user card read the same text. */
export const userDisplayName = (user: AuthUser | null): string => user?.fullName?.trim() || 'User';

export const userInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

/** The real role from the API (`SUPER_ADMIN` -> "Super Admin"). */
export const roleLabel = (role: string | null): string =>
  role
    ? role
        .split('_')
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ')
    : 'User';
