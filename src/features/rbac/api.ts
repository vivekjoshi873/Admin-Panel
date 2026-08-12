import { api } from '@/shared/api/client';
import type {
  AssignRolePermissionsPayload,
  AssignUserRolesPayload,
  CreatePermissionPayload,
  CreateRolePayload,
  CreateUserPayload,
  PermissionModuleGroup,
  UpdatePermissionPayload,
  UpdateRolePayload,
  UpdateUserPayload,
} from '@/shared/types/rbac';

function unwrap<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

function unwrapList<T>(payload: any): T[] {
  const body = payload?.data ?? payload;
  if (Array.isArray(body)) return body as T[];
  if (Array.isArray(body?.data)) return body.data as T[];
  if (Array.isArray(body?.items)) return body.items as T[];
  return [];
}

export async function getRoles(): Promise<any[]> {
  const { data } = await api.get('/api/v1/roles');
  return unwrapList<any>(data);
}

export async function createRole(payload: CreateRolePayload): Promise<any> {
  const { data } = await api.post('/api/v1/roles', payload);
  return unwrap<any>(data);
}

export async function updateRole(roleId: string, payload: UpdateRolePayload): Promise<any> {
  const { data } = await api.patch(`/api/v1/roles/${roleId}`, payload);
  return unwrap<any>(data);
}

export async function deleteRole(roleId: string): Promise<void> {
  await api.delete(`/api/v1/roles/${roleId}`);
}

export async function getPermissionsModules(): Promise<PermissionModuleGroup[]> {
  const { data } = await api.get('/api/v1/permissions/modules');
  const body = data?.data ?? data;
  // expected: [{ module, permissions: Permission[] }]
  return body ?? [];
}

export async function createPermission(payload: CreatePermissionPayload): Promise<any> {
  const { data } = await api.post('/api/v1/permissions', payload);
  return unwrap<any>(data);
}

export async function updatePermission(permissionId: string, payload: UpdatePermissionPayload): Promise<any> {
  const { data } = await api.patch(`/api/v1/permissions/${permissionId}`, payload);
  return unwrap<any>(data);
}

export async function deletePermission(permissionId: string): Promise<void> {
  await api.delete(`/api/v1/permissions/${permissionId}`);
}

export async function getRolePermissions(roleId: string): Promise<string[]> {
  const { data } = await api.get(`/api/v1/roles/${roleId}/permissions`);
  const body = data?.data ?? data;
  // Some backends return permissionIds; others return permission objects.
  if (Array.isArray(body)) return body as string[];
  if (Array.isArray(body?.permissionIds)) return body.permissionIds as string[];
  if (Array.isArray(body?.permissions)) {
    return body.permissions.map((p: any) => (typeof p === 'string' ? p : p.id ?? p.permissionId ?? p.slug));
  }
  return [];
}

export async function assignRolePermissions(
  roleId: string,
  payload: AssignRolePermissionsPayload,
): Promise<void> {
  await api.post(`/api/v1/roles/${roleId}/permissions`, payload);
}

export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<any> {
  const { data } = await api.get('/api/v1/users', { params });
  return data?.data ?? data;
}

export async function createUser(payload: CreateUserPayload): Promise<any> {
  const { data } = await api.post('/api/v1/users', payload);
  return unwrap<any>(data);
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<any> {
  const { data } = await api.patch(`/api/v1/users/${userId}`, payload);
  return unwrap<any>(data);
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/api/v1/users/${userId}`);
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const { data } = await api.get(`/api/v1/users/${userId}/roles`);
  const body = data?.data ?? data;
  if (Array.isArray(body)) return body as string[];
  if (Array.isArray(body?.roleIds)) return body.roleIds as string[];
  if (Array.isArray(body?.roles)) return body.roles.map((r: any) => r.id ?? r.roleId ?? r.slug);
  return [];
}

export async function assignUserRoles(userId: string, payload: AssignUserRolesPayload): Promise<void> {
  await api.post(`/api/v1/users/${userId}/roles`, payload);
}

