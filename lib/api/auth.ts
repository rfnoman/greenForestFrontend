import { apiClient } from "./client";
import type { TokenResponse, User } from "@/lib/types";

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  login: (data: LoginInput) => apiClient.post<TokenResponse>("/token/pair", data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ access: string }>("/token/refresh/", { refresh: refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post("/token/blacklist/", { refresh: refreshToken }),

  getMe: () => apiClient.get<User>("/users/me"),

  updateMe: (data: Partial<User>) => apiClient.patch<User>("/users/me", data),
};
