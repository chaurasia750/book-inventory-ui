import { ValidRoleId } from './role.enum';

export interface Session {
  userId: string;
  roleId: ValidRoleId;
  isAuthenticated: boolean;
  expiresAt: number;
  lastActivity: number;
}
