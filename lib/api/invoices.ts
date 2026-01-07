import { apiClient } from "./client";
import type { Invoice, CreateInvoiceInput, RecordPaymentInput, InvoiceStatus } from "@/lib/types";

export interface InvoicesListParams {
  status?: InvoiceStatus;
  limit?: number;
}

export const invoicesApi = {
  list: (params?: InvoicesListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit.toString();
    return apiClient.get<Invoice[]>("/invoices", queryParams);
  },

  get: (id: string) => apiClient.get<Invoice>(`/invoices/${id}`),

  create: (data: CreateInvoiceInput) => apiClient.post<Invoice>("/invoices", data),

  send: (id: string) => apiClient.post<Invoice>(`/invoices/${id}/send`),

  recordPayment: (id: string, data: RecordPaymentInput) =>
    apiClient.post<Invoice>(`/invoices/${id}/payments`, data),

  void: (id: string, reason?: string) =>
    apiClient.post<Invoice>(`/invoices/${id}/void`, { reason }),
};
