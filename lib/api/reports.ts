import { apiClient } from "./client";
import type {
  DashboardData,
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalance,
  InvoiceAgingReport,
  BillAgingReport,
} from "@/lib/types";

export interface DateRangeParams {
  start_date: string;
  end_date: string;
}

export interface AsOfDateParams {
  as_of_date: string;
}

export const reportsApi = {
  getDashboard: () => apiClient.get<DashboardData>("/reports/dashboard"),

  getProfitLoss: (params: DateRangeParams) =>
    apiClient.get<ProfitLossReport>("/reports/profit-loss", {
      start_date: params.start_date,
      end_date: params.end_date,
    }),

  getBalanceSheet: (params: AsOfDateParams) =>
    apiClient.get<BalanceSheetReport>("/reports/balance-sheet", {
      as_of_date: params.as_of_date,
    }),

  getCashFlow: (params: DateRangeParams) =>
    apiClient.get<CashFlowReport>("/reports/cash-flow", {
      start_date: params.start_date,
      end_date: params.end_date,
    }),

  getTrialBalance: () => apiClient.get<TrialBalance>("/reports/trial-balance"),

  getInvoiceAging: () => apiClient.get<InvoiceAgingReport>("/reports/invoice-aging"),

  getBillAging: () => apiClient.get<BillAgingReport>("/reports/bill-aging"),
};
