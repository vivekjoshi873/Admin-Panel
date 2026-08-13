# Bingo Admin Panel

Frontend admin workspace for the Bingo marketplace API. Covers **authentication**, **RBAC**, **dashboard**, **analytics**, **profile**, and **settings**. Product / order / vendor / booking / payment modules are intentionally out of scope.

API reference: [Marketplace API Docs](http://13.159.7.199:5001/docs)

---

## What this app does

| Area | Features |
|------|----------|
| **Auth** | Login, register + OTP, forgot / reset / set password, logout, logout-all |
| **Session** | JWT access + refresh, silent refresh on `401`, session restore on reload |
| **RBAC** | Roles & permissions CRUD, permission matrix, users list + role assign |
| **Dashboard** | KPI cards from `/admin/dashboard`, recent orders from analytics |
| **Analytics** | Period filters, custom date range, timeseries chart, top products / vendors / customers |
| **Profile** | View / edit profile, change password |
| **Settings** | Categories list, dynamic group forms (`/admin/settings/group/{slug}`) |

UI includes loading skeletons, empty states, toasts, light/dark theme, and permission-aware actions (hide / disable when the caller lacks the slug).

---

## Stack

- **React 18** + **TypeScript** + **Vite**
- **React Router v6** — app routing
- **TanStack Query** — server state
- **Zustand** — auth / UI / toast stores
- **Axios** — HTTP client + refresh interceptor
- **React Hook Form** + **Zod** — forms & validation
- **Tailwind CSS v4** — styling
- **Recharts** — analytics charts
- **Radix UI** — Select, Popover, Dialog (shadcn-style primitives)
- **Vitest** — unit tests

---

## Project structure

```text
src/
  app/                 # App shell, providers, router
  features/
    auth/              # Login, register, OTP, password flows
    rbac/              # Roles, permissions, matrix, users
    dashboard/         # KPI overview
    analytics/         # Marketplace analytics
    profile/           # Account profile
    settings/          # Admin settings groups
  shared/
    api/               # Axios client + 401 refresh queue
    components/        # UI primitives, layout, guards
    hooks/
    lib/               # permissions, roles, query keys
    stores/            # auth, ui, toast
    types/
```

Feature folders follow: `api.ts` → pages / components → schemas where needed.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` → `.env`:

```bash
VITE_API_BASE_URL=http://13.159.7.199:5001
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend origin. Used by the **Vite dev proxy** (`/api` → this host). |
| `VITE_API_DIRECT` | Optional. Set to `true` only to call the API host from the browser (skip same-origin `/api` proxy). |

By default the app always calls **same-origin** `/api/...`:

- **Local:** Vite proxies to `VITE_API_BASE_URL`
- **Vercel:** `vercel.json` rewrites `/api/*` to the API host

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm test` | Vitest (run once) |
| `npm run test:watch` | Vitest watch mode |

---

## Routes

### Public

| Path | Page |
|------|------|
| `/login` | Sign in |
| `/register` | Register |
| `/verify-otp` | Email OTP |
| `/forgot-password` | Request reset |
| `/reset-password` | Reset with token + OTP |
| `/set-password` | Set password (authenticated) |

### Protected (requires session)

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/analytics` | Analytics |
| `/rbac/roles` | Roles |
| `/rbac/permissions` | Permissions |
| `/rbac/matrix` | Permission matrix |
| `/rbac/users` | Users |
| `/profile` | Profile |
| `/settings` | Settings categories |
| `/settings/group/:slug` | Settings group form |

---

## Auth & permissions

### Session

- Access + refresh tokens (and a cached user snapshot) persist in **`localStorage`**
- Axios attaches `Authorization: Bearer <accessToken>`
- On **401**, a single shared refresh runs; queued requests retry with the new token
- `AuthBootstrap` restores the session on cold load via stored tokens + `/auth/profile`

### Role-based UI

Actions check permission slugs from the profile (with aliases like `role.update` ↔ `roles.update`).  
`super_admin` bypasses checks in the frontend (same idea as the API docs).

Important admin API permissions (from Swagger):

| Action | Typical slug |
|--------|----------------|
| View analytics | `analytics.view` |
| Update roles / matrix | `role.update` |
| Assign user roles | `user.update` |
| Manage settings | `settings.manage` |

If Analytics or role edits return **403**, the logged-in account is missing those slugs on the backend — not a broken route.

---

## API surface used

Base path: `/api/v1`

- **Auth:** `login`, `profile`, `refresh`, `logout`, `logout-all`, `forgot-password`, `reset-password`, `set-password`, register / OTP helpers
- **RBAC:** `/roles`, `/permissions`, `/permissions/modules`, role↔permission assign, `/users`, user↔role assign
- **Admin:** `/admin/dashboard`, `/admin/analytics` (+ timeseries, inventory, products, customers)
- **Settings:** `/admin/settings/sidebar`, categories, `/admin/settings/group/{slug}`

Response mappers tolerate common envelopes (`data`, nested `user`, `accessToken` / `access_token`).

---

## Deploy (Vercel)

`vercel.json` already:

1. Proxies `/api/:path*` → `http://13.159.7.199:5001/api/:path*`
2. SPA-rewrites all other routes to `index.html`

**Do not** set `VITE_API_DIRECT=true` on Vercel unless you intentionally call the HTTP API from the browser (mixed content / CORS risk).

After changing env or `vercel.json`, **redeploy**.

---

## Testing

```bash
npm test
```

Focused coverage includes auth permission helpers, login schema, and token/session helpers under `src/features/auth/__tests__` and `src/shared/lib/__tests__`.

---

## Notes for reviewers

1. Use an **Admin** account with the right permission set (or `super_admin`) to exercise Analytics and RBAC writes.
2. **Vendor** / **Customer** logins are different API actors (`/vendor…`, `/customer…`) — this UI is the **admin** panel only.
3. Empty analytics charts with a **200** response usually mean little marketplace activity for that period, not a failed request.
