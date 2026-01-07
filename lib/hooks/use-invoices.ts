"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, InvoicesListParams } from "@/lib/api/invoices";
import type { CreateInvoiceInput, RecordPaymentInput } from "@/lib/types";

export function useInvoices(params?: InvoicesListParams) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.list(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordPaymentInput }) =>
      invoicesApi.recordPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      invoicesApi.void(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
