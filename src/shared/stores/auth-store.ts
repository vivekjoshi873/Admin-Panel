import { create } from 'zustand';
import type { AuthUser } from '@/shared/types/auth';

type AuthStatus = 'idle' | 'hydrating' | 'authenticated' | 'anonymous';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (accessToken: string, user?: AuthUser | null) => void;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  clearSession: () => void;
  hasPermission: (permission: string | string[]) => boolean;
};


export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  status: 'idle',

  setSession: (accessToken, user = null) =>
    set({
      accessToken,
      ...(user !== undefined ? { user } : {}),
      status: 'authenticated',
    }),

  setUser: (user) => set({ user }),

  setStatus: (status) => set({ status }),

  clearSession: () =>
    set({
      accessToken: null,
      user: null,
      status: 'anonymous',
    }),

  hasPermission: (permission) => {
    const perms = get().user?.permissions ?? [];
    if (perms.includes('*') || perms.includes('admin.*')) return true;
    const needed = Array.isArray(permission) ? permission : [permission];
    return needed.some((p) => perms.includes(p));
  },
}));

const REFRESH_STORAGE_KEY = 'bingo.refreshToken';

export function stashRefreshToken(token: string | null | undefined) {
  if (!token) return;
  try {
    sessionStorage.setItem(REFRESH_STORAGE_KEY, token);
  } catch {
    // private mode / quota — refresh will rely on cookie only
  }
}

export function readStashedRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStashedRefreshToken() {
  try {
    sessionStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
