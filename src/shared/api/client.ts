import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  clearStashedAccessToken,
  clearStashedRefreshToken,
  readStashedRefreshToken,
  stashAccessToken,
  stashRefreshToken,
  useAuthStore,
} from '@/shared/stores/auth-store';
import { extractAuthTokens } from '@/shared/lib/auth-tokens';

const rawBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

// Always call same-origin `/api/...`:
// - local: Vite proxy → API
// - Vercel: vercel.json rewrite → API
// Set VITE_API_DIRECT=true only if you must hit the API host from the browser.
const baseURL =
  import.meta.env.VITE_API_DIRECT === 'true' ? rawBase : '';

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
  const stashed = readStashedRefreshToken();
  // RefreshTokenDto requires refreshToken — an empty body is a 400, not a cookie refresh.
  if (!stashed) {
    throw new Error('No refresh token');
  }

  // Dedicated axios call (not `api`) so a 401 here does not re-enter the interceptor.
  const { data } = await axios.post(
    `${baseURL}/api/v1/auth/refresh`,
    { refreshToken: stashed },
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const tokens = extractAuthTokens(data);
  if (!tokens.accessToken) {
    throw new Error('Refresh response missing access token');
  }

  if (tokens.refreshToken) stashRefreshToken(tokens.refreshToken);
  stashAccessToken(tokens.accessToken);

  useAuthStore.getState().setSession(tokens.accessToken);
  return tokens.accessToken;
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
      clearStashedAccessToken();
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
      clearStashedAccessToken();
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
