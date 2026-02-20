"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import type { User } from "@/lib/types";
import { toast } from "sonner";

type AccountantRole = "accountant" | "accountant_supervisor";

interface AccountantAuthContextType {
  user: User | null;
  owners: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  role: AccountantRole;
  logout: () => Promise<void>;
  handleImpersonate: (ownerEmail: string) => Promise<void>;
}

const AccountantAuthContext = createContext<AccountantAuthContextType | undefined>(undefined);

const STORAGE_KEYS: Record<AccountantRole, { access: string; refresh: string; role: string }> = {
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

interface AccountantAuthProviderProps {
  children: React.ReactNode;
  role: AccountantRole;
}

export function AccountantAuthProvider({ children, role }: AccountantAuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const keys = STORAGE_KEYS[role];
  const loginPath = role === "accountant" ? "/accountant/login" : "/accountant-supervisor/login";

  const clearAuth = useCallback(() => {
    localStorage.removeItem(keys.access);
    localStorage.removeItem(keys.refresh);
    localStorage.removeItem(keys.role);
    apiClient.setAccessToken(null);
    apiClient.setRoleId(null);
  }, [keys]);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(keys.access);
      const roleId = localStorage.getItem(keys.role);
      if (!accessToken) {
        router.push(loginPath);
        return;
      }

      apiClient.setAccessToken(accessToken);
      if (roleId) {
        apiClient.setRoleId(roleId);
      }

      try {
        const userData = await authApi.getMe();
        if (userData.user_type !== role) {
          clearAuth();
          router.push(loginPath);
          return;
        }
        setUser(userData);

        const ownersList = await apiClient.get<User[]>("/users/owners");
        setOwners(ownersList);
      } catch {
        clearAuth();
        router.push(loginPath);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router, keys, role, loginPath, clearAuth]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(keys.refresh);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }
    clearAuth();
    router.push(loginPath);
  }, [keys, clearAuth, router, loginPath]);

  const handleImpersonate = useCallback(async (ownerEmail: string) => {
    try {
      const response = await apiClient.post<{ access: string; refresh: string; user: User }>(
        "/users/impersonate",
        { email: ownerEmail }
      );

      localStorage.setItem("greenforest_access_token", response.access);
      localStorage.setItem("greenforest_refresh_token", response.refresh);
      const roleId = localStorage.getItem(keys.role);
      if (roleId) {
        localStorage.setItem("greenforest_role_id", roleId);
      }
      localStorage.setItem("greenforest_impersonated", "true");

      toast.success(`Now viewing as ${response.user.email}`);
      window.location.href = "/";
    } catch {
      toast.error("Failed to impersonate user");
    }
  }, [keys]);

  return (
    <AccountantAuthContext.Provider
      value={{
        user,
        owners,
        isLoading,
        isAuthenticated: !!user,
        role,
        logout,
        handleImpersonate,
      }}
    >
      {children}
    </AccountantAuthContext.Provider>
  );
}

export function useAccountantAuth() {
  const context = useContext(AccountantAuthContext);
  if (context === undefined) {
    throw new Error("useAccountantAuth must be used within an AccountantAuthProvider");
  }
  return context;
}
