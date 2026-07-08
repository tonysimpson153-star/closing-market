import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthUser {
  id: number;
  email: string | null;
  name: string | null;
  role: "user" | "seller" | "company" | "admin";
  isVerified: boolean;
  sellerStatus: "pending" | "approved" | "rejected" | "suspended" | null;
  companyStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
  profileImageUrl: string | null;
  phone?: string | null;
  loginMethod?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const TOKEN_KEY = "closing_market_token";
const USER_KEY = "closing_market_user";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token: string, user: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    // AsyncStorage 먼저 삭제 후 상태 초기화 (순서 중요: 복원 방지)
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
