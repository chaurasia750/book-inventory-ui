import { ValidRoleId } from './role.enum';

export interface AuthResponse {
  roleId: ValidRoleId;
  userId: string;
  expiresIn: number;
}
