'use client';
import { create } from 'zustand';
import { fetchMe, logoutSession, refreshAccessToken, setAuthToken } from '@/lib/api';

interface FounderUser { id: string; email: string; username: string; is_admin: boolean; }

interface AuthState {
  token: string | null;
  user: FounderUser | null;
  ready: boolean;
  setToken: (t: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,
  async setToken(t) {
    setAuthToken(t);
    try {
      const user = await fetchMe();
      set({ token: t, user, ready: true });
    } catch (error) {
      setAuthToken(null);
      set({ token: null, user: null, ready: true });
      throw error;
    }
  },
  logout() {
    void logoutSession().catch(() => undefined);
    setAuthToken(null);
    set({ token: null, user: null });
  },
  async hydrate() {
    try {
      const t = await refreshAccessToken();
      setAuthToken(t);
      const user = await fetchMe();
      set({ token: t, user, ready: true });
    } catch {
      setAuthToken(null);
      set({ token: null, user: null, ready: true });
    }
  },
}));
