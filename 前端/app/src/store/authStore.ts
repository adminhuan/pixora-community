import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  username: string;
  avatar?: string;
  role: 'guest' | 'user' | 'moderator' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (payload: { user: AuthUser; accessToken: string }) => void;
  setAccessToken: (accessToken: string | null) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: ({ user, accessToken }) => {
        set({ user, accessToken, isAuthenticated: true });
      },
      setAccessToken: (accessToken) => {
        set((state) => ({
          accessToken,
          isAuthenticated: Boolean(accessToken) && Boolean(state.user)
        }));
      },
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user
        })),
      clearSession: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    }),
    {
      name: 'apc-auth-state',
      partialize: (state) => ({
        user: state.user
      })
    }
  )
);
