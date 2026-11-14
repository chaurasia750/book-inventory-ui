export type Role = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  roles: Role[];
  createdAt: string;
}

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  timezone?: string;
}
