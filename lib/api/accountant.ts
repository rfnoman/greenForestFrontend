import { apiClient } from "./client";
import type { AccountantDashboardData } from "@/lib/types";

export const accountantApi = {
  getDashboard: () =>
    apiClient.get<AccountantDashboardData>("/reports/accountant-dashboard"),
};
