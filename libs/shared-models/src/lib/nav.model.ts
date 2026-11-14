import { Role } from './user.model';

export interface NavItem {
  label: string;
  path?: string;
  icon?: string;
  children?: NavItem[];
  roles?: Role[];
}
