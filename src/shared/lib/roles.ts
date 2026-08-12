import type { UserRole } from '@/shared/types/auth';

type RoleJoin = {
  id?: string | number;
  name?: string;
  slug?: string;
  roleId?: string | number;
  role?: { id?: string | number; name?: string; slug?: string };
};

type PermissionJoin = {
  id?: string | number;
  slug?: string;
  permissionId?: string | number;
  permission?: { id?: string | number; slug?: string };
};

/** API returns either `{ id, name, slug }` or a join row `{ role: { id, name, slug } }`. */
export function flattenRoles(roles: unknown): UserRole[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((entry) => {
      const row = entry as RoleJoin;
      const inner = row.role ?? row;
      const slug = String(inner.slug ?? row.slug ?? '');
      const name = String(inner.name ?? row.name ?? slug);
      const id = String(inner.id ?? row.roleId ?? '');
      if (!id && !slug && !name) return null;
      return { id, name, slug };
    })
    .filter((role): role is UserRole => role !== null);
}

function unwrapList(payload: unknown): unknown[] {
  const body = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(body)) return body;
  const nested = body as { data?: unknown; items?: unknown; roles?: unknown; permissions?: unknown; roleIds?: unknown; permissionIds?: unknown };
  if (Array.isArray(nested?.data)) return nested.data;
  if (Array.isArray(nested?.items)) return nested.items;
  if (Array.isArray(nested?.roles)) return nested.roles;
  if (Array.isArray(nested?.permissions)) return nested.permissions;
  if (Array.isArray(nested?.roleIds)) return nested.roleIds;
  if (Array.isArray(nested?.permissionIds)) return nested.permissionIds;
  return [];
}

/**
 * Join rows use their own `id` (assignment pk). Prefer the nested entity id / *Id field.
 */
export function extractRoleIds(payload: unknown): string[] {
  return unwrapList(payload)
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      const row = item as RoleJoin;
      if (row.role || row.roleId != null) {
        return String(row.role?.id ?? row.roleId ?? row.role?.slug ?? '');
      }
      return String(row.id ?? row.slug ?? '');
    })
    .filter(Boolean);
}

export function extractPermissionIds(payload: unknown): string[] {
  return unwrapList(payload)
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      const row = item as PermissionJoin;
      if (row.permission || row.permissionId != null) {
        return String(row.permission?.id ?? row.permissionId ?? row.permission?.slug ?? '');
      }
      return String(row.id ?? row.slug ?? '');
    })
    .filter(Boolean);
}

/** Swagger examples send numeric ids (`roleIds: [2]`). */
export function toApiIds(ids: Array<string | number>): Array<number | string> {
  return ids.map((id) => {
    const n = Number(id);
    return Number.isFinite(n) && String(n) === String(id).trim() ? n : id;
  });
}
