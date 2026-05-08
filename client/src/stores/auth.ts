import { create } from "zustand";
import { User } from "@/types";
import { authApi } from "@/services/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; studentId?: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    set({ user: data.user });
  },
  register: async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    set({ user: res.data.user });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null });
  },
  fetchUser: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
