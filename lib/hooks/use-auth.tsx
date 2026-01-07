"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "greenforest_access_token";
const REFRESH_TOKEN_KEY = "greenforest_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    apiClient.setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken) {
        apiClient.setAccessToken(accessToken);
        try {
          await refreshUser();
        } catch {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            try {
              const { access } = await authApi.refresh(refreshToken);
              localStorage.setItem(ACCESS_TOKEN_KEY, access);
              apiClient.setAccessToken(access);
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
    const { access, refresh } = await authApi.login({ email, password });
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    apiClient.setAccessToken(access);
    await refreshUser();
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
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
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
