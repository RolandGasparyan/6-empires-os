import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchMe,
  logoutSession,
  refreshAccessToken,
  setAuthToken,
} from '@/lib/api';
import { useAuth } from './auth';

vi.mock('@/lib/api', () => ({
  fetchMe: vi.fn(),
  logoutSession: vi.fn(),
  refreshAccessToken: vi.fn(),
  setAuthToken: vi.fn(),
}));

const founder = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'founder@example.com',
  username: 'founder',
  is_admin: true,
};

describe('authentication store', () => {
  beforeEach(() => {
    useAuth.setState({ token: null, user: null, ready: false });
  });

  it('persists authenticated state only after identity validation succeeds', async () => {
    vi.mocked(fetchMe).mockResolvedValue(founder);

    await useAuth.getState().setToken('access-token');

    expect(setAuthToken).toHaveBeenCalledWith('access-token');
    expect(useAuth.getState()).toMatchObject({
      token: 'access-token',
      user: founder,
      ready: true,
    });
  });

  it('clears the access token when identity validation fails', async () => {
    vi.mocked(fetchMe).mockRejectedValue(new Error('unauthorized'));

    await expect(useAuth.getState().setToken('stale-token')).rejects.toThrow('unauthorized');

    expect(setAuthToken).toHaveBeenLastCalledWith(null);
    expect(useAuth.getState()).toMatchObject({ token: null, user: null, ready: true });
  });

  it('hydrates through the HttpOnly refresh-cookie flow', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue('rotated-access-token');
    vi.mocked(fetchMe).mockResolvedValue(founder);

    await useAuth.getState().hydrate();

    expect(setAuthToken).toHaveBeenCalledWith('rotated-access-token');
    expect(useAuth.getState()).toMatchObject({
      token: 'rotated-access-token',
      user: founder,
      ready: true,
    });
  });

  it('clears state when refresh-cookie hydration fails', async () => {
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error('expired'));

    await useAuth.getState().hydrate();

    expect(setAuthToken).toHaveBeenLastCalledWith(null);
    expect(useAuth.getState()).toMatchObject({ token: null, user: null, ready: true });
  });

  it('revokes the server session and clears memory on logout', () => {
    vi.mocked(logoutSession).mockResolvedValue(undefined);
    useAuth.setState({ token: 'access-token', user: founder, ready: true });

    useAuth.getState().logout();

    expect(logoutSession).toHaveBeenCalledOnce();
    expect(setAuthToken).toHaveBeenLastCalledWith(null);
    expect(useAuth.getState()).toMatchObject({ token: null, user: null, ready: true });
  });
});
