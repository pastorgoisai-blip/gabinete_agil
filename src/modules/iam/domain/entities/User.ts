export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'volunteer';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserPermissions {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  cabinetId: string | null;
  avatarUrl?: string;
  lastAccess?: string;
  isSuperAdmin?: boolean;
  permissions?: Record<string, UserPermissions>;
  bio?: string;
  phone?: string;
}
