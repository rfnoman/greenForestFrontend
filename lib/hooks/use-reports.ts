"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi, DateRangeParams, AsOfDateParams } from "@/lib/api/reports";

export function useDashboard() {
  return useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => reportsApi.getDashboard(),
  });
}

export function useProfitLoss(params: DateRangeParams) {
  return useQuery({
    queryKey: ["reports", "profit-loss", params],
    queryFn: () => reportsApi.getProfitLoss(params),
    enabled: !!params.start_date && !!params.end_date,
  });
}

export function useBalanceSheet(params: AsOfDateParams) {
  return useQuery({
    queryKey: ["reports", "balance-sheet", params],
    queryFn: () => reportsApi.getBalanceSheet(params),
    enabled: !!params.as_of_date,
  });
}

export function useCashFlow(params: DateRangeParams) {
  return useQuery({
    queryKey: ["reports", "cash-flow", params],
    queryFn: () => reportsApi.getCashFlow(params),
    enabled: !!params.start_date && !!params.end_date,
  });
}

export function useTrialBalance() {
  return useQuery({
    queryKey: ["reports", "trial-balance"],
    queryFn: () => reportsApi.getTrialBalance(),
  });
}

export function useInvoiceAging() {
  return useQuery({
    queryKey: ["reports", "invoice-aging"],
    queryFn: () => reportsApi.getInvoiceAging(),
  });
}

export function useBillAging() {
  return useQuery({
    queryKey: ["reports", "bill-aging"],
    queryFn: () => reportsApi.getBillAging(),
  });
}
