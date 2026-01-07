"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billsApi, BillsListParams } from "@/lib/api/bills";
import type { CreateBillInput, RecordPaymentInput } from "@/lib/types";

export function useBills(params?: BillsListParams) {
  return useQuery({
    queryKey: ["bills", params],
    queryFn: () => billsApi.list(params),
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ["bills", id],
    queryFn: () => billsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBillInput) => billsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useRecordBillPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordPaymentInput }) =>
      billsApi.recordPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["bills", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useVoidBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      billsApi.void(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["bills", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}
