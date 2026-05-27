import { create } from 'zustand';
import { authApi } from '@/lib/api';

const useAuthStore = create((set, get) => ({
  user:      null,
  isLoading: true,

  // ─── Fetch current user (called on app mount) ─────────────
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.getMe();
      set({ user: res.data.user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  // ─── Login ────────────────────────────────────────────────
  login: async (credentials) => {
    const res = await authApi.login(credentials);
    set({ user: res.data.user });
    return res.data;
  },

  // ─── Logout ───────────────────────────────────────────────
  logout: async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    set({ user: null });
    if (typeof window !== 'undefined') window.location.href = '/login';
  },

  // ─── Update local user copy after profile save ────────────
  setUser: (user) => set({ user }),

  // ─── Role helpers ─────────────────────────────────────────
  isAdmin: () => {
    const role = get().user?.role;
    return role === 'admin' || role === 'superadmin';
  },

  isSuperAdmin: () => get().user?.role === 'superadmin',

  isActive: () => get().user?.activation_status === 'active',
}));

export { useAuthStore };
export default useAuthStore;
