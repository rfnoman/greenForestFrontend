import { apiClient } from "./client";
import type { TokenResponse, OneAuthLoginResponse, SetRoleResponse, User, RegisterInput, RegisterResponse } from "@/lib/types";

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  login: (data: LoginInput) => apiClient.post<TokenResponse>("/auth/token", data),

  register: (data: RegisterInput) => apiClient.post<RegisterResponse>("/auth/register", data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ access: string }>("/auth/token/refresh/", { refresh: refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post("/auth/token/blacklist/", { refresh: refreshToken }),

  getMe: () => apiClient.get<User>("/users/me"),

  updateMe: (data: Partial<User>) => apiClient.patch<User>("/users/me", data),

  endImpersonation: (refreshToken: string | null) =>
    apiClient.post<{ access: string; refresh: string; user: User }>(
      "/users/end-impersonate",
      { refresh: refreshToken }
    ),

  oneAuthLogin: (data: { one_auth_token: string; login_type: "owner_manager" | "staff" }) =>
    apiClient.post<OneAuthLoginResponse>("/auth/one-auth/login", data),

  setRole: (data: { user_type: "owner" | "manager" | "accountant" | "accountant_supervisor" }) =>
    apiClient.post<SetRoleResponse>("/users/me/set-role", data),
};
