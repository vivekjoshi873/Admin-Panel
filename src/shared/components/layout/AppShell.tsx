import { NavLink, Outlet } from 'react-router-dom';
import { useUiStore } from '@/shared/stores/ui-store';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/shared/components/ui/Button';
import { displayName, cn } from '@/shared/lib/cn';
import { usePermission } from '@/shared/hooks/usePermission';

/**
 * Fallback nav until `/admin/settings/sidebar` is wired in the Settings module.
 * Each item still respects permission slugs so RBAC demos work before Settings lands.
 */
const FALLBACK_NAV = [
  { label: 'Dashboard', path: '/', permission: null },
  { label: 'Analytics', path: '/analytics', permission: 'analytics.read' },
  { label: 'Roles', path: '/rbac/roles', permission: 'roles.read' },
  { label: 'Permissions', path: '/rbac/permissions', permission: 'permissions.read' },
  { label: 'Permission matrix', path: '/rbac/matrix', permission: 'roles.update' },
  { label: 'Users', path: '/rbac/users', permission: 'users.read' },
  { label: 'Profile', path: '/profile', permission: null },
  { label: 'Settings', path: '/settings', permission: 'settings.read' },
] as const;

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  return (
    <nav className="flex flex-col gap-1 p-3">
      {FALLBACK_NAV.map((item) => {
        if (item.permission && !hasPermission(item.permission)) return null;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)] dark:hover:bg-white/5',
              )
            }
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppShell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const canLogoutAll = usePermission('auth.logout-all');

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[auto_1fr]">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen flex-col border-r border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--line)] px-3">
          {!collapsed ? (
            <span className="font-display text-lg font-semibold">Bingo</span>
          ) : (
            <span className="font-display text-lg font-semibold">B</span>
          )}
          <button
            type="button"
            className="rounded-md p-1.5 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
        {!collapsed ? <NavItems /> : <div className="p-3 text-xs text-[var(--muted)]">···</div>}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 flex-col bg-[var(--surface)] shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-[var(--line)] px-4">
              <span className="font-display text-lg font-semibold">Bingo</span>
              <button type="button" onClick={() => setMobileOpen(false)}>
                ✕
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)]/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <p className="truncate text-sm text-[var(--muted)]">
              {user ? displayName(user) : 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
            {canLogoutAll ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => logout.mutate(true)}
                loading={logout.isPending}
              >
                Logout all
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logout.mutate(false)}
              loading={logout.isPending}
            >
              Logout
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
