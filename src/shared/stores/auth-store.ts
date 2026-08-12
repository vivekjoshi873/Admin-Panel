import { create } from 'zustand';
import type { AuthUser } from '@/shared/types/auth';
import { isSuperAdmin, permissionMatches } from '@/shared/lib/permissions';

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

const REFRESH_STORAGE_KEY = 'bingo.refreshToken';
const ACCESS_STORAGE_KEY = 'bingo.accessToken';
const USER_STORAGE_KEY = 'bingo.user';

function storageGet(key: string): string | null {
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return fromLocal;
    // Migrate tokens stashed by earlier sessionStorage-based builds.
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) {
      localStorage.setItem(key, fromSession);
      sessionStorage.removeItem(key);
      return fromSession;
    }
    return null;
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode / quota
  }
}

function storageRemove(key: string) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function stashRefreshToken(token: string | null | undefined) {
  if (!token) return;
  storageSet(REFRESH_STORAGE_KEY, token);
}

export function readStashedRefreshToken(): string | null {
  return storageGet(REFRESH_STORAGE_KEY);
}

export function clearStashedRefreshToken() {
  storageRemove(REFRESH_STORAGE_KEY);
}

export function stashAccessToken(token: string | null | undefined) {
  if (!token) return;
  storageSet(ACCESS_STORAGE_KEY, token);
}

export function readStashedAccessToken(): string | null {
  return storageGet(ACCESS_STORAGE_KEY);
}

export function clearStashedAccessToken() {
  storageRemove(ACCESS_STORAGE_KEY);
}

function stashUser(user: AuthUser | null | undefined) {
  if (!user) return;
  try {
    storageSet(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function readStashedUser(): AuthUser | null {
  const raw = storageGet(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function clearStashedUser() {
  storageRemove(USER_STORAGE_KEY);
}

function clearPersistedSession() {
  clearStashedAccessToken();
  clearStashedRefreshToken();
  clearStashedUser();
}

const initialAccessToken = readStashedAccessToken();
const initialUser = readStashedUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialAccessToken,
  user: initialUser,
  status: initialAccessToken ? 'authenticated' : 'idle',

  setSession: (accessToken, user) => {
    stashAccessToken(accessToken);
    if (user) stashUser(user);
    set((state) => ({
      accessToken,
      user: user === undefined ? state.user : user,
      status: 'authenticated',
    }));
  },

  setUser: (user) => {
    if (user) stashUser(user);
    else clearStashedUser();
    set({ user });
  },

  setStatus: (status) => set({ status }),

  clearSession: () => {
    clearPersistedSession();
    set({
      accessToken: null,
      user: null,
      status: 'anonymous',
    });
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (isSuperAdmin(user?.roles)) return true;
    return permissionMatches(user?.permissions ?? [], permission);
  },
}));
