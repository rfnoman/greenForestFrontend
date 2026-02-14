import { apiClient, ApiError } from "./client";
import type { Income, CreateIncomeInput } from "@/lib/types";

export interface IncomesListParams {
  income_type?: string;
  limit?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const incomesApi = {
  list: (params?: IncomesListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.income_type) queryParams.income_type = params.income_type;
    if (params?.limit) queryParams.limit = params.limit.toString();
    return apiClient.get<Income[]>("/incomes", queryParams);
  },

  get: (id: string) => apiClient.get<Income>(`/incomes/${id}`),

  create: (data: CreateIncomeInput) => apiClient.post<Income>("/incomes", data),

  uploadReceipt: async (incomeId: string, file: File): Promise<Income> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = apiClient.getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const businessId = apiClient.getBusinessId();
    if (businessId) headers["X-Business-ID"] = businessId;
    const roleId = apiClient.getRoleId();
    if (roleId) headers["X-Role"] = roleId;

    const response = await fetch(`${API_BASE}/incomes/${incomeId}/upload-receipt`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(response.status, error.detail || "Upload failed", error);
    }

    return response.json();
  },

  delete: (id: string, reason?: string) => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return apiClient.delete(`/incomes/${id}${query}`);
  },
};
