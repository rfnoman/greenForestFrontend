import { apiClient } from "./client";
import type { Account, CreateAccountInput, AccountType } from "@/lib/types";

export interface AccountsListParams {
  account_type?: AccountType;
  is_active?: string;
}

export interface AccountBalanceResponse {
  account_id: string;
  balance: string;
  as_of_date: string;
}

export const accountsApi = {
  list: (params?: AccountsListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.account_type) queryParams.account_type = params.account_type;
    if (params?.is_active) queryParams.is_active = params.is_active;
    return apiClient.get<Account[]>("/accounts", queryParams);
  },

  get: (id: string) => apiClient.get<Account>(`/accounts/${id}`),

  create: (data: CreateAccountInput) => apiClient.post<Account>("/accounts", data),

  update: (id: string, data: Partial<CreateAccountInput>) =>
    apiClient.patch<Account>(`/accounts/${id}`, data),

  getBalance: (id: string) =>
    apiClient.get<AccountBalanceResponse>(`/accounts/${id}/balance`),
};
