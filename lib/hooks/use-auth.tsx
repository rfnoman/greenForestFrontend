"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import type { User, RegisterInput } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "greenforest_access_token";
const REFRESH_TOKEN_KEY = "greenforest_refresh_token";
const ROLE_ID_KEY = "greenforest_role_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const clearAuth = useCallback(() => {
    // Clear all greenforest keys from localStorage
    const keysToRemove = Object.keys(localStorage).filter((key) =>
      key.startsWith("greenforest_")
    );
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    apiClient.setAccessToken(null);
    apiClient.setRoleId(null);
    apiClient.setBusinessId(null);
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      // Only allow owner and manager
      // if (userData.user_type === 'accountant') {
      //   clearAuth();
      //   return;
      // }
      setUser(userData);
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const roleId = localStorage.getItem(ROLE_ID_KEY);
      if (storedToken) {
        apiClient.setAccessToken(storedToken);
        setAccessToken(storedToken);
        if (roleId) {
          apiClient.setRoleId(roleId);
        }
        try {
          await refreshUser();
        } catch {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            try {
              const { access } = await authApi.refresh(refreshToken);
              localStorage.setItem(ACCESS_TOKEN_KEY, access);
              apiClient.setAccessToken(access);
              setAccessToken(access);
              await refreshUser();
            } catch {
              clearAuth();
            }
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser, clearAuth]);

  const login = async (email: string, password: string) => {
    // Clear any previous session data before logging in
    clearAuth();
    queryClient.clear();

    const { access, refresh, role_id } = await authApi.login({ email, password });
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(ROLE_ID_KEY, role_id);
    apiClient.setAccessToken(access);
    apiClient.setRoleId(role_id);
    setAccessToken(access);

    // Fetch user data to check user type
    const userData = await authApi.getMe();

    // Only allow owner and manager to login
    if (userData.user_type === 'accountant') {
      clearAuth();
      throw new Error('Access denied. Only owners and managers can login to this portal.');
    }

    setUser(userData);
    router.push("/");
  };

  const register = async (data: RegisterInput) => {
    // Clear any previous session data before registering
    clearAuth();
    queryClient.clear();

    const { access, refresh, user: userData } = await authApi.register(data);
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(ROLE_ID_KEY, userData.id);
    apiClient.setAccessToken(access);
    apiClient.setRoleId(userData.id);
    setAccessToken(access);
    setUser(userData);
    router.push("/");
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }
    clearAuth();
    queryClient.clear();
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        accessToken,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
