import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  clearStashedRefreshToken,
  readStashedRefreshToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';

const rawBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

// In dev we hit the Vite proxy (`/api/...`) so cookies + CORS behave predictably.
const baseURL = import.meta.env.DEV ? '' : rawBase;

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type QueueEntry = {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueEntry[] = [];

function flushQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((entry) => {
    if (error) entry.reject(error);
    else entry.resolve(token);
  });
  refreshQueue = [];
}

function isAuthRefreshUrl(url?: string) {
  if (!url) return false;
  return (
    url.includes('/api/v1/auth/refresh') ||
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/logout')
  );
}

async function requestSilentRefresh(): Promise<string> {
  const body: Record<string, string> = {};
  const stashed = readStashedRefreshToken();
  if (stashed) body.refreshToken = stashed;

  // Dedicated axios call (not `api`) so a 401 here does not re-enter the interceptor.
  const { data } = await axios.post(
    `${baseURL}/api/v1/auth/refresh`,
    Object.keys(body).length ? body : undefined,
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const accessToken: string =
    data?.accessToken ?? data?.access_token ?? data?.token ?? data?.data?.accessToken;

  if (!accessToken) {
    throw new Error('Refresh response missing access token');
  }

  const nextRefresh = data?.refreshToken ?? data?.refresh_token ?? data?.data?.refreshToken;
  if (nextRefresh) stashRefreshToken(nextRefresh);

  useAuthStore.getState().setSession(accessToken);
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isAuthRefreshUrl(original.url)) {
      useAuthStore.getState().clearSession();
      clearStashedRefreshToken();
      return Promise.reject(error);
    }

    // Concurrent 401s share one refresh; later callers wait on the queue.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const token = await requestSilentRefresh();
      flushQueue(null, token);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      useAuthStore.getState().clearSession();
      clearStashedRefreshToken();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Exported for unit tests — mirrors the in-flight refresh gate. */
export const __refreshInternals = {
  get isRefreshing() {
    return isRefreshing;
  },
  get queueLength() {
    return refreshQueue.length;
  },
  reset() {
    isRefreshing = false;
    refreshQueue = [];
  },
};
