import { useAuthStore } from '@/shared/stores/auth-store';

type PermissionGateProps = {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** When true, render children disabled instead of hiding them. */
  disableInstead?: boolean;
};

export function PermissionGate({
  permission,
  children,
  fallback = null,
  disableInstead = false,
}: PermissionGateProps) {
  const allowed = useAuthStore((s) => s.hasPermission(permission));

  if (allowed) return <>{children}</>;

  if (disableInstead) {
    return (
      <span className="inline-flex cursor-not-allowed opacity-45" aria-disabled title="Missing permission">
        <span className="pointer-events-none">{children}</span>
      </span>
    );
  }

  return <>{fallback}</>;
}
