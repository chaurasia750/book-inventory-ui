import { APP_URLS } from '@org/constants';
import { AppRole, isStaffRole } from '@org/shared-models';

/** The app a role works in: staff in `admin`; agents and company accounts (Owner, Staff) in `member`. */
export function homeUrlForRole(role: AppRole): string {
  return isStaffRole(role) ? APP_URLS.ADMIN : APP_URLS.MEMBER;
}
