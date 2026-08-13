/** Swagger permission slugs, plus aliases the UI may still use. */
const ALIASES: Record<string, string[]> = {
  'analytics.view': ['analytics.view', 'analytics.read'],
  'analytics.read': ['analytics.view', 'analytics.read'],
  'settings.view': ['settings.view', 'settings.read'],
  'settings.read': ['settings.view', 'settings.read'],
  'settings.manage': ['settings.manage', 'settings.write', 'settings.update'],
  'role.view': ['role.view', 'roles.read'],
  'roles.read': ['role.view', 'roles.read'],
  'role.create': ['role.create', 'roles.create'],
  'roles.create': ['role.create', 'roles.create'],
  'role.update': ['role.update', 'roles.update'],
  'roles.update': ['role.update', 'roles.update'],
  'role.delete': ['role.delete', 'roles.delete'],
  'roles.delete': ['role.delete', 'roles.delete'],
  'permission.view': ['permission.view', 'permissions.read'],
  'permissions.read': ['permission.view', 'permissions.read'],
  'permission.create': ['permission.create', 'permissions.create'],
  'permissions.create': ['permission.create', 'permissions.create'],
  'permission.update': ['permission.update', 'permissions.update'],
  'permissions.update': ['permission.update', 'permissions.update'],
  'permission.delete': ['permission.delete', 'permissions.delete'],
  'permissions.delete': ['permission.delete', 'permissions.delete'],
  'user.view': ['user.view', 'users.read'],
  'users.read': ['user.view', 'users.read'],
  'user.create': ['user.create', 'users.create'],
  'users.create': ['user.create', 'users.create'],
  'user.update': ['user.update', 'users.update'],
  'users.update': ['user.update', 'users.update'],
  'user.delete': ['user.delete', 'users.delete'],
  'users.delete': ['user.delete', 'users.delete'],
};

export function permissionMatches(owned: string[], needed: string | string[]): boolean {
  if (owned.includes('*') || owned.includes('admin.*')) return true;
  const list = Array.isArray(needed) ? needed : [needed];
  return list.some((slug) => {
    const aliases = ALIASES[slug] ?? [slug];
    return aliases.some((a) => owned.includes(a));
  });
}

function normalizeRoleKey(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '_');
}

export function isSuperAdmin(
  roles?: Array<{ slug?: string; name?: string; role?: { slug?: string; name?: string } }>,
): boolean {
  return (roles ?? []).some((r) => {
    const slug = normalizeRoleKey(r.slug ?? r.role?.slug ?? '');
    const name = normalizeRoleKey(r.name ?? r.role?.name ?? '');
    return (
      slug === 'super_admin' ||
      name === 'super_admin' ||
      slug === 'superadmin' ||
      name === 'superadmin'
    );
  });
}

export function isForbidden(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}
