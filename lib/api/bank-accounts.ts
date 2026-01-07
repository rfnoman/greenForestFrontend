import { apiClient } from "./client";
import type { BankAccount, CreateBankAccountInput } from "@/lib/types";

export const bankAccountsApi = {
  list: () => apiClient.get<BankAccount[]>("/bank-accounts"),

  get: (id: string) => apiClient.get<BankAccount>(`/bank-accounts/${id}`),

  create: (data: CreateBankAccountInput) =>
    apiClient.post<BankAccount>("/bank-accounts", data),

  update: (id: string, data: Partial<CreateBankAccountInput>) =>
    apiClient.patch<BankAccount>(`/bank-accounts/${id}`, data),
};
