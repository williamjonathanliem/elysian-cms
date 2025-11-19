// src/hooks/use-auth-store.ts
import { create } from "zustand";

type AuthUser = {
  id: number;
  username: string;
  role: string;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
