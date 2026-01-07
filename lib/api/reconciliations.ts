import { apiClient } from "./client";
import type { Reconciliation, StartReconciliationInput } from "@/lib/types";

export const reconciliationsApi = {
  list: () => apiClient.get<Reconciliation[]>("/reconciliations"),

  get: (id: string) => apiClient.get<Reconciliation>(`/reconciliations/${id}`),

  start: (data: StartReconciliationInput) =>
    apiClient.post<Reconciliation>("/reconciliations/start", data),
};
