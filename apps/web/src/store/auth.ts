'use client';
import { create } from 'zustand';
import { setAuthToken, fetchMe } from '@/lib/api';

interface FounderUser { id: string; email: string; username: string; is_admin: boolean; }

interface AuthState {
  token: string | null;
  user: FounderUser | null;
  ready: boolean;
  setToken: (t: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

const KEY = '6empire_token';

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,
  async setToken(t) {
    setAuthToken(t);
    if (typeof window !== 'undefined') localStorage.setItem(KEY, t);
    const user = await fetchMe().catch(() => null);
    set({ token: t, user, ready: true });
  },
  logout() {
    setAuthToken(null);
    if (typeof window !== 'undefined') localStorage.removeItem(KEY);
    set({ token: null, user: null });
  },
  async hydrate() {
    const t = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!t) { set({ ready: true }); return; }
    setAuthToken(t);
    const user = await fetchMe().catch(() => null);
    set({ token: t, user, ready: true });
  },
}));
