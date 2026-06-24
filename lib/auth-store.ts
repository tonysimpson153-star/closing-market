import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthUser {
  id: number;
  email: string | null;
  name: string | null;
  role: "user" | "admin";
  userType: "buyer" | "seller";
  isVerified: boolean;
  sellerStatus: "pending" | "approved" | "rejected" | null;
  profileImageUrl: string | null;
  phone?: string | null;
  loginMethod?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  loadFromStorage: () => Promise<void>;
}

const TOKEN_KEY = "closing_market_token";
const USER_KEY = "closing_market_user";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token: string, user: AuthUser) => {
    set({ token, user });
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth: async () => {
    set({ token: null, user: null });
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
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
