import { apiClient } from "./client";
import type { Expense, CreateExpenseInput } from "@/lib/types";

export interface ExpensesListParams {
  limit?: number;
}

export const expensesApi = {
  list: (params?: ExpensesListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    return apiClient.get<Expense[]>("/expenses", queryParams);
  },

  get: (id: string) => apiClient.get<Expense>(`/expenses/${id}`),

  create: (data: CreateExpenseInput) => apiClient.post<Expense>("/expenses", data),

  delete: (id: string) => apiClient.delete(`/expenses/${id}`),
};
