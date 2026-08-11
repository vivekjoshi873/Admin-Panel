import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth-store';

type Props = {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
};

/**
 * Route-level gate. Prefer `PermissionGate` inside pages when you only need to
 * hide a button rather than bounce the whole route.
 */
export function RoleRoute({ permission, children, fallback, redirectTo = '/' }: Props) {
  const allowed = useAuthStore((s) => s.hasPermission(permission));

  if (!allowed) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
