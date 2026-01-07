import { apiClient } from "./client";
import type { User } from "@/lib/types";

export const usersApi = {
  getMe: () => apiClient.get<User>("/users/me"),

  updateMe: (data: Partial<User>) => apiClient.patch<User>("/users/me", data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/users/me/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};
