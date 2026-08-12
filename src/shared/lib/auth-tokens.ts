/**
 * Walk a login/refresh payload and pull access/refresh tokens from common Nest shapes:
 * - { accessToken, refreshToken }
 * - { data: { tokens: { accessToken, refreshToken } } }
 * - snake_case variants
 */
export function extractAuthTokens(payload: unknown): {
  accessToken?: string;
  refreshToken?: string;
} {
  const found: { accessToken?: string; refreshToken?: string } = {};

  const visit = (node: unknown, depth: number) => {
    if (!node || depth > 6) return;
    if (typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1);
      return;
    }

    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 10) {
        const k = key.toLowerCase();
        if (!found.accessToken && (k === 'accesstoken' || k === 'access_token' || k === 'token')) {
          // Prefer explicit access keys over generic "token" if we already have one later.
          if (k === 'token' && found.accessToken) {
            // keep existing
          } else if (k !== 'token' || !found.accessToken) {
            if (k === 'accesstoken' || k === 'access_token') found.accessToken = value;
            else if (k === 'token' && !found.accessToken) found.accessToken = value;
          }
        }
        if (!found.refreshToken && (k === 'refreshtoken' || k === 'refresh_token')) {
          found.refreshToken = value;
        }
      } else if (value && typeof value === 'object') {
        visit(value, depth + 1);
      }
    }
  };

  visit(payload, 0);
  return found;
}
