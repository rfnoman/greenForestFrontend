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
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  endImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "greenforest_access_token";
const REFRESH_TOKEN_KEY = "greenforest_refresh_token";
const ROLE_ID_KEY = "greenforest_role_id";

// Impersonation localStorage keys
const IMPERSONATED_KEY = "greenforest_impersonated";
const IMP_ACCESS_KEY = "greenforest_impersonation_access";
const IMP_REFRESH_KEY = "greenforest_impersonation_refresh";
const IMP_ROLE_ID_KEY = "greenforest_impersonation_role_id";
const IMP_ROLE_KEY = "greenforest_impersonation_role";

// Accountant role-specific storage key mappings
const ACCOUNTANT_STORAGE_KEYS: Record<string, { access: string; refresh: string; role: string }> = {
  accountant: {
    access: "greenforest_accountant_access_token",
    refresh: "greenforest_accountant_refresh_token",
    role: "greenforest_role_id",
  },
  accountant_supervisor: {
    access: "greenforest_supervisor_access_token",
    refresh: "greenforest_supervisor_refresh_token",
    role: "greenforest_supervisor_role_id",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const clearImpersonationKeys = useCallback(() => {
    localStorage.removeItem(IMPERSONATED_KEY);
    localStorage.removeItem(IMP_ACCESS_KEY);
    localStorage.removeItem(IMP_REFRESH_KEY);
    localStorage.removeItem(IMP_ROLE_ID_KEY);
    localStorage.removeItem(IMP_ROLE_KEY);
    setIsImpersonating(false);
  }, []);

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
    setIsImpersonating(false);
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
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const roleId = localStorage.getItem(ROLE_ID_KEY);
      const impersonated = localStorage.getItem(IMPERSONATED_KEY);

      if (impersonated === "true") {
        setIsImpersonating(true);
      }

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

    const wasImpersonating = isImpersonating;
    const impRole = localStorage.getItem(IMP_ROLE_KEY);

    clearAuth();
    queryClient.clear();

    if (wasImpersonating) {
      const loginPath = impRole === "accountant_supervisor"
        ? "/accountant-supervisor/login"
        : "/accountant/login";
      window.location.href = loginPath;
    } else {
      router.push("/login");
    }
  };

  const endImpersonation = useCallback(async () => {
    const impRole = localStorage.getItem(IMP_ROLE_KEY) as "accountant" | "accountant_supervisor" | null;
    const impAccess = localStorage.getItem(IMP_ACCESS_KEY);
    const impRefresh = localStorage.getItem(IMP_REFRESH_KEY);
    const impRoleId = localStorage.getItem(IMP_ROLE_ID_KEY);

    const dashboardPath = impRole === "accountant_supervisor"
      ? "/accountant-supervisor/dashboard"
      : "/accountant/dashboard";

    const accountantKeys = ACCOUNTANT_STORAGE_KEYS[impRole || "accountant"];

    try {
      const ownerRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      const response = await authApi.endImpersonation(ownerRefresh);

      // Clear owner tokens
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ROLE_ID_KEY);
      localStorage.removeItem("greenforest_current_business");

      // Store fresh accountant tokens in role-specific keys
      localStorage.setItem(accountantKeys.access, response.access);
      localStorage.setItem(accountantKeys.refresh, response.refresh);
      localStorage.setItem(accountantKeys.role, impRoleId || response.user.id);

      clearImpersonationKeys();
      queryClient.clear();
      window.location.href = dashboardPath;
    } catch {
      // API failed — fall back to stored original tokens
      if (impAccess) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(ROLE_ID_KEY);
        localStorage.removeItem("greenforest_current_business");

        localStorage.setItem(accountantKeys.access, impAccess);
        if (impRefresh) {
          localStorage.setItem(accountantKeys.refresh, impRefresh);
        }
        if (impRoleId) {
          localStorage.setItem(accountantKeys.role, impRoleId);
        }

        clearImpersonationKeys();
        queryClient.clear();
        window.location.href = dashboardPath;
      } else {
        // No fallback — force full logout
        clearAuth();
        queryClient.clear();
        const loginPath = impRole === "accountant_supervisor"
          ? "/accountant-supervisor/login"
          : "/accountant/login";
        window.location.href = loginPath;
      }
    }
  }, [clearAuth, clearImpersonationKeys, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        accessToken,
        isImpersonating,
        login,
        register,
        logout,
        refreshUser,
        endImpersonation,
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
