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
import { extractPermissionIds, extractRoleIds, toApiIds } from '@/shared/lib/roles';

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
  const { data } = await api.post('/api/v1/roles', {
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    level: Number(payload.level),
  });
  return unwrap<any>(data);
}

export async function updateRole(roleId: string, payload: UpdateRolePayload): Promise<any> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.slug !== undefined) body.slug = payload.slug;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.level !== undefined) body.level = Number(payload.level);

  const { data } = await api.patch(`/api/v1/roles/${roleId}`, body);
  return unwrap<any>(data);
}

export async function deleteRole(roleId: string): Promise<void> {
  await api.delete(`/api/v1/roles/${roleId}`);
}

function groupPermissions(list: any[]): PermissionModuleGroup[] {
  const grouped = new Map<string, any[]>();
  for (const p of list) {
    const module = String(p.module ?? 'general');
    if (!grouped.has(module)) grouped.set(module, []);
    grouped.get(module)!.push(p);
  }
  return Array.from(grouped.entries()).map(([module, permissions]) => ({ module, permissions }));
}

export async function getPermissionsModules(): Promise<PermissionModuleGroup[]> {
  try {
    const { data } = await api.get('/api/v1/permissions/modules');
    const body = data?.data ?? data;
    if (Array.isArray(body) && body[0]?.permissions) return body as PermissionModuleGroup[];
    if (Array.isArray(body?.modules)) return body.modules as PermissionModuleGroup[];
    if (Array.isArray(body) && body[0]?.slug) return groupPermissions(body);
  } catch {
    // fall through to flat list
  }

  const { data } = await api.get('/api/v1/permissions');
  return groupPermissions(unwrapList<any>(data));
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
  return extractPermissionIds(data);
}

export async function assignRolePermissions(
  roleId: string,
  payload: AssignRolePermissionsPayload,
): Promise<void> {
  await api.post(`/api/v1/roles/${roleId}/permissions`, {
    permissionIds: toApiIds(payload.permissionIds),
  });
}

export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<any> {
  // Swagger only documents `status`. Extra paging/search params are handled in the UI.
  const { data } = await api.get('/api/v1/users', {
    params: params?.status ? { status: params.status } : undefined,
  });
  return data?.data ?? data;
}

export async function createUser(payload: CreateUserPayload): Promise<any> {
  const { data } = await api.post('/api/v1/users', {
    ...payload,
    roleIds: payload.roleIds ? toApiIds(payload.roleIds) : undefined,
  });
  return unwrap<any>(data);
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<any> {
  // UpdateUserDto (Swagger): fullName, email, password, phone, roleIds — not isActive.
  const body: Record<string, unknown> = {};
  if (payload.fullName !== undefined) body.fullName = payload.fullName;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.password !== undefined) body.password = payload.password;
  if (payload.roleIds !== undefined) body.roleIds = toApiIds(payload.roleIds);

  const { data } = await api.patch(`/api/v1/users/${userId}`, body);
  return unwrap<any>(data);
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/api/v1/users/${userId}`);
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const { data } = await api.get(`/api/v1/users/${userId}/roles`);
  return extractRoleIds(data);
}

export async function assignUserRoles(userId: string, payload: AssignUserRolesPayload): Promise<void> {
  const roleIds = toApiIds(payload.roleIds);
  // AssignRoleDto is empty in Swagger; UpdateUserDto documents `roleIds: number[]`.
  // Prefer the documented PATCH, then the dedicated assign endpoint.
  try {
    await api.patch(`/api/v1/users/${userId}`, { roleIds });
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 400 || status === 404 || status === 405 || status === 422) {
      await api.post(`/api/v1/users/${userId}/roles`, { roleIds });
      return;
    }
    throw error;
  }
}

