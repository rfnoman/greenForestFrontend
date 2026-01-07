import { apiClient } from "./client";
import type { Bill, CreateBillInput, RecordPaymentInput, BillStatus } from "@/lib/types";

export interface BillsListParams {
  status?: BillStatus;
  limit?: number;
}

export const billsApi = {
  list: (params?: BillsListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit.toString();
    return apiClient.get<Bill[]>("/bills", queryParams);
  },

  get: (id: string) => apiClient.get<Bill>(`/bills/${id}`),

  create: (data: CreateBillInput) => apiClient.post<Bill>("/bills", data),

  recordPayment: (id: string, data: RecordPaymentInput) =>
    apiClient.post<Bill>(`/bills/${id}/payments`, data),

  void: (id: string, reason?: string) =>
    apiClient.post<Bill>(`/bills/${id}/void`, { reason }),
};
