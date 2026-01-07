import { apiClient } from "./client";
import type {
  BankTransaction,
  CreateBankTransactionInput,
  CategorizeTransactionInput,
} from "@/lib/types";

export interface BankTransactionsListParams {
  bank_account_id?: string;
  is_reconciled?: string;
  limit?: number;
}

export const bankTransactionsApi = {
  list: (params?: BankTransactionsListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.bank_account_id) queryParams.bank_account_id = params.bank_account_id;
    if (params?.is_reconciled) queryParams.is_reconciled = params.is_reconciled;
    if (params?.limit) queryParams.limit = params.limit.toString();
    return apiClient.get<BankTransaction[]>("/bank-transactions", queryParams);
  },

  get: (id: string) => apiClient.get<BankTransaction>(`/bank-transactions/${id}`),

  create: (data: CreateBankTransactionInput) =>
    apiClient.post<BankTransaction>("/bank-transactions", data),

  categorize: (id: string, data: CategorizeTransactionInput) =>
    apiClient.post<BankTransaction>(`/bank-transactions/${id}/categorize`, data),
};
