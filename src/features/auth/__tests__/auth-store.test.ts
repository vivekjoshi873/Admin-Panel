import { beforeEach, describe, expect, it } from 'vitest';
import {
  readStashedAccessToken,
  useAuthStore,
} from '@/shared/stores/auth-store';

describe('auth session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      user: null,
      status: 'idle',
    });
  });

  it('writes the access token and user to localStorage on setSession', () => {
    useAuthStore.getState().setSession('access-token-value-here', {
      id: '1',
      email: 'a@b.com',
      roles: [],
      permissions: [],
    });
    expect(readStashedAccessToken()).toBe('access-token-value-here');
    expect(JSON.parse(localStorage.getItem('bingo.user') ?? '{}').email).toBe('a@b.com');
  });

  it('keeps the current user when setSession is called with only a token', () => {
    useAuthStore.getState().setSession('tok-one', {
      id: '1',
      email: 'a@b.com',
      roles: [],
      permissions: [],
    });
    useAuthStore.getState().setSession('tok-two');
    expect(useAuthStore.getState().user?.email).toBe('a@b.com');
    expect(useAuthStore.getState().accessToken).toBe('tok-two');
  });

  it('clears persisted tokens on clearSession', () => {
    useAuthStore.getState().setSession('tok-one');
    useAuthStore.getState().clearSession();
    expect(readStashedAccessToken()).toBeNull();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});
