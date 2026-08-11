# Bingo Admin

Production-style admin panel (RBAC, dashboard, analytics, profile, settings).

## Stack

React 18 · TypeScript · Vite · TanStack Query · Zustand · Axios · Tailwind · React Router v6 · RHF + Zod · Recharts · Vitest

## Setup

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` (see `.env.example`). Dev server proxies `/api` to that host.

At scaffold time the API host was unreachable from this environment. Response mappers tolerate common envelopes (`data`, `access_token`). Tune feature `api.ts` files against Swagger when the host is up.

## Scripts

- `npm run dev` — Vite
- `npm run build` — typecheck + build
- `npm run lint` / `npm run format`
- `npm test` — Vitest

## Auth tokens

- Access token: Zustand memory only
- Refresh: httpOnly cookie preferred (`withCredentials`); body refresh token falls back to `sessionStorage` (see `auth-store.ts`)
- Concurrent 401s share one refresh via a queue in `shared/api/client.ts`

## Module order

Auth → RBAC → Dashboard → Analytics → Profile → Settings
