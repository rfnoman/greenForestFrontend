import { apiClient } from "./client";
import type {
  JournalEntry,
  CreateJournalEntryInput,
  JournalEntryStatus,
  TrialBalance,
} from "@/lib/types";

export interface JournalEntriesListParams {
  status?: JournalEntryStatus;
  limit?: number;
}

export interface LedgerEntry {
  entry_id: string;
  entry_number: string;
  entry_date: string;
  account_id: string;
  account_code: string;
  account_name: string;
  description: string | null;
  debit: string;
  credit: string;
  balance: string;
}

export const journalEntriesApi = {
  list: (params?: JournalEntriesListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit.toString();
    return apiClient.get<JournalEntry[]>("/journal-entries", queryParams);
  },

  get: (id: string) => apiClient.get<JournalEntry>(`/journal-entries/${id}`),

  create: (data: CreateJournalEntryInput) =>
    apiClient.post<JournalEntry>("/journal-entries", data),

  post: (id: string) => apiClient.post<JournalEntry>(`/journal-entries/${id}/post`),

  void: (id: string, reason: string) =>
    apiClient.post<JournalEntry>(`/journal-entries/${id}/void`, { reason }),

  getLedger: (params?: { account_id?: string; start_date?: string; end_date?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.account_id) queryParams.account_id = params.account_id;
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    return apiClient.get<LedgerEntry[]>("/journal-entries/ledger", queryParams);
  },

  getTrialBalance: () => apiClient.get<TrialBalance>("/journal-entries/trial-balance"),
};
