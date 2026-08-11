import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/shared/stores/auth-store';
import { __refreshInternals } from '@/shared/api/client';

describe('auth permission checks', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'tok',
      status: 'authenticated',
      user: {
        id: '1',
        email: 'a@b.com',
        roles: [{ id: 'r1', name: 'Editor', slug: 'editor' }],
        permissions: ['users.read', 'roles.read'],
      },
    });
  });

  it('allows an exact permission slug', () => {
    expect(useAuthStore.getState().hasPermission('users.read')).toBe(true);
  });

  it('denies a missing permission without throwing', () => {
    expect(useAuthStore.getState().hasPermission('users.delete')).toBe(false);
  });

  it('passes when any of several permissions match', () => {
    expect(useAuthStore.getState().hasPermission(['users.delete', 'roles.read'])).toBe(true);
  });

  it('treats admin.* as a superuser capability', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'a@b.com',
        roles: [],
        permissions: ['admin.*'],
      },
    });
    expect(useAuthStore.getState().hasPermission('settings.write')).toBe(true);
  });
});

describe('refresh queue internals', () => {
  beforeEach(() => {
    __refreshInternals.reset();
  });

  it('starts with an empty queue and idle refresh flag', () => {
    expect(__refreshInternals.isRefreshing).toBe(false);
    expect(__refreshInternals.queueLength).toBe(0);
  });
});
