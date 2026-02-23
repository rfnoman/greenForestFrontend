import { apiClient } from "./client";
import type { TokenResponse, User, RegisterInput, RegisterResponse } from "@/lib/types";

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
};
