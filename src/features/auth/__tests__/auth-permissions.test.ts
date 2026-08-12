import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/shared/stores/auth-store';
import { __refreshInternals } from '@/shared/api/client';
import { unwrapUser } from '../api';
import { isSuperAdmin } from '@/shared/lib/permissions';

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

  it('maps users.read to the Swagger user.view slug', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'a@b.com',
        roles: [],
        permissions: ['user.view'],
      },
    });
    expect(useAuthStore.getState().hasPermission('users.read')).toBe(true);
    expect(useAuthStore.getState().hasPermission('user.view')).toBe(true);
  });

  it('grants every permission to super_admin', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'a@b.com',
        roles: [{ id: 'r1', name: 'Super Admin', slug: 'super_admin' }],
        permissions: [],
      },
    });
    expect(useAuthStore.getState().hasPermission('analytics.view')).toBe(true);
    expect(useAuthStore.getState().hasPermission('role.delete')).toBe(true);
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

describe('unwrapUser profile envelope', () => {
  it('reads nested data.roles[].role and does not treat a customer as super admin', () => {
    const user = unwrapUser({
      message: 'Profile fetched successfully',
      data: {
        id: '109',
        email: 'vivekjo.dev@gmail.com',
        roles: [
          {
            id: '123',
            roleId: '11',
            role: { id: '11', name: 'CUSTOMER', slug: 'customer' },
          },
        ],
        permissions: ['customer.profile.view', 'customer.order.view'],
      },
      roles: [],
      permissions: [],
    });

    expect(user.email).toBe('vivekjo.dev@gmail.com');
    expect(user.roles).toEqual([{ id: '11', name: 'CUSTOMER', slug: 'customer' }]);
    expect(user.permissions).toEqual(['customer.profile.view', 'customer.order.view']);
    expect(isSuperAdmin(user.roles)).toBe(false);
  });

  it('detects super_admin when the role is nested under roles[].role', () => {
    const user = unwrapUser({
      data: {
        id: '1',
        email: 'admin@example.com',
        roles: [{ role: { id: '1', name: 'Super Admin', slug: 'super_admin' } }],
        permissions: ['analytics.view'],
      },
    });

    expect(isSuperAdmin(user.roles)).toBe(true);
    expect(user.roles[0]?.slug).toBe('super_admin');
  });

  it('still finds email when data.user is an empty object', () => {
    const user = unwrapUser({
      data: {
        email: 'fallback@bingo.dev',
        user: {},
        roles: [],
        permissions: [],
      },
    });
    expect(user.email).toBe('fallback@bingo.dev');
  });
});
