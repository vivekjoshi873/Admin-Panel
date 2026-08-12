export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  roles: {
    all: ['roles'] as const,
    detail: (id: string) => ['roles', id] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    modules: ['permissions', 'modules'] as const,
  },
  users: {
    all: (params?: Record<string, unknown>) => ['users', params ?? {}] as const,
    detail: (id: string) => ['users', id] as const,
  },
  dashboard: {
    root: ['admin', 'dashboard'] as const,
  },
  analytics: {
    root: (params?: Record<string, unknown>) => ['admin', 'analytics', params ?? {}] as const,
    timeseries: (params?: Record<string, unknown>) =>
      ['admin', 'analytics', 'timeseries', params ?? {}] as const,
    orders: (params?: Record<string, unknown>) =>
      ['admin', 'analytics', 'orders', params ?? {}] as const,
    revenue: (params?: Record<string, unknown>) =>
      ['admin', 'analytics', 'revenue', params ?? {}] as const,
    inventory: ['admin', 'analytics', 'inventory'] as const,
    products: ['admin', 'analytics', 'products'] as const,
    customers: (params?: Record<string, unknown>) =>
      ['admin', 'analytics', 'customers', params ?? {}] as const,
  },
  settings: {
    sidebar: ['admin', 'settings', 'sidebar'] as const,
    categories: ['admin', 'settings', 'categories'] as const,
    group: (slug: string) => ['admin', 'settings', 'group', slug] as const,
  },
};
