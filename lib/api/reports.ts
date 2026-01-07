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

export const reportsApi = {
  getDashboard: () => apiClient.get<DashboardData>("/reports/dashboard"),

  getProfitLoss: (startDate: string, endDate: string) =>
    apiClient.get<ProfitLossReport>("/reports/profit-loss", {
      start_date: startDate,
      end_date: endDate,
    }),

  getBalanceSheet: (asOfDate: string) =>
    apiClient.get<BalanceSheetReport>("/reports/balance-sheet", {
      as_of_date: asOfDate,
    }),

  getCashFlow: (startDate: string, endDate: string) =>
    apiClient.get<CashFlowReport>("/reports/cash-flow", {
      start_date: startDate,
      end_date: endDate,
    }),

  getTrialBalance: () => apiClient.get<TrialBalance>("/reports/trial-balance"),

  getInvoiceAging: () => apiClient.get<InvoiceAgingReport>("/reports/invoice-aging"),

  getBillAging: () => apiClient.get<BillAgingReport>("/reports/bill-aging"),
};
