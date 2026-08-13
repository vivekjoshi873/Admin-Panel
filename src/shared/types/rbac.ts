import type { Permission, Role } from './auth';

export type CreateRolePayload = {
  name: string;
  slug?: string;
  description?: string;
  /** Hierarchy rank — API requires integer >= 1. */
  level: number;
};

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type CreatePermissionPayload = {
  name: string;
  slug: string;
  module: string;
  description?: string;
};

export type UpdatePermissionPayload = Partial<CreatePermissionPayload>;

export type PermissionModuleGroup = {
  module: string;
  permissions: Permission[];
};

export type AssignRolePermissionsPayload = {
  permissionIds: string[];
};

export type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  isActive: boolean;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserPayload = {
  email: string;
  password: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleIds?: string[];
};

export type UpdateUserPayload = {
  email?: string;
  fullName?: string;
  phone?: string;
  password?: string;
  /** Swagger UpdateUserDto — numeric role ids. */
  roleIds?: Array<string | number>;
};

export type AssignUserRolesPayload = {
  roleIds: string[];
};
