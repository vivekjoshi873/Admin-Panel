import { NavLink, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  LineChart,
  Shield,
  KeyRound,
  Grid3X3,
  Users,
  UserRound,
  Settings,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  LogOut,
  X,
} from 'lucide-react';
import { useUiStore } from '@/shared/stores/ui-store';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/shared/components/ui/Button';
import { displayName, cn } from '@/shared/lib/cn';
import { BlurFade } from '@/shared/components/magicui/BlurFade';

const NAV = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Analytics', path: '/analytics', icon: LineChart },
  { label: 'Roles', path: '/rbac/roles', icon: Shield },
  { label: 'Permissions', path: '/rbac/permissions', icon: KeyRound },
  { label: 'Permission matrix', path: '/rbac/matrix', icon: Grid3X3 },
  { label: 'Users', path: '/rbac/users', icon: Users },
  { label: 'Profile', path: '/profile', icon: UserRound },
  { label: 'Settings', path: '/settings', icon: Settings },
] as const;

const SIDEBAR_EXPANDED = 256;
const SIDEBAR_COLLAPSED = 76;

const spring = { type: 'spring' as const, stiffness: 280, damping: 30, mass: 0.85 };

function SidebarNavItems({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item, index) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={item.label}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_0_0_1px_rgb(13_107_82_/_0.12)]'
                  : 'text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)] dark:hover:bg-white/[0.05]',
              )
            }
          >
            <motion.span
              layout
              transition={spring}
              className="inline-flex shrink-0"
            >
              <Icon className="size-[18px] opacity-90" />
            </motion.span>
            <AnimatePresence initial={false} mode="wait">
              {!collapsed ? (
                <motion.span
                  key={`${item.path}-label`}
                  initial={{ opacity: 0, x: -8, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -6, width: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.015 }}
                  className="truncate whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </NavLink>
        );
      })}
    </nav>
  );
}

function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      transition={spring}
      className="sticky top-0 z-20 hidden h-screen flex-col overflow-hidden border-r border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-xl lg:flex"
    >
      <div className="flex h-16 shrink-0 items-center border-b border-[var(--line)] px-3">
        <div className="flex min-w-0 flex-1 items-center">
          <AnimatePresence initial={false} mode="wait">
            {!collapsed ? (
              <motion.div
                key="brand-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="font-display text-xl font-semibold tracking-tight">Bingo</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Admin
                </p>
              </motion.div>
            ) : (
              <motion.span
                key="brand-mini"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className="mx-auto font-display text-xl font-semibold"
              >
                B
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-black/[0.04] hover:text-[var(--ink)] dark:hover:bg-white/[0.05]"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span
            key={collapsed ? 'open' : 'close'}
            initial={{ rotate: collapsed ? -90 : 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.22 }}
            className="inline-flex"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </motion.span>
        </motion.button>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <SidebarNavItems collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={spring}
            className="relative z-10 flex h-full w-72 flex-col border-r border-[var(--line)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-[var(--line)] px-4">
              <span className="font-display text-xl font-semibold">Bingo</span>
              <button type="button" className="rounded-lg p-2" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <SidebarNavItems onNavigate={onClose} />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
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

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)]/75 px-4 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user ? displayName(user) : 'Admin'}</p>
              <p className="truncate text-xs text-[var(--muted)]">{user?.email ?? 'Signed in'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className='cursor-pointer' size="sm" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4 " />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logout.mutate(true)}
              loading={logout.isPending}
              className="hidden md:inline-flex"
            >
              Logout all
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logout.mutate(false)}
              loading={logout.isPending}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6">
          <BlurFade>
            <Outlet />
          </BlurFade>
        </main>
      </div>
    </div>
  );
}
