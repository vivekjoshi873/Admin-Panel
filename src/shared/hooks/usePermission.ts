import { useAuthStore } from '@/shared/stores/auth-store';

export function usePermission(permission: string | string[]) {
  return useAuthStore((s) => s.hasPermission(permission));
}
