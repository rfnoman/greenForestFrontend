"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supervisorApi, type AllJournalEntriesParams } from "@/lib/api/supervisor";

/**
 * Hook to fetch paginated journal entries across all businesses.
 * Uses the dedicated /all-journal-entries endpoint.
 */
export function useAllJournalEntries(params?: AllJournalEntriesParams) {
  return useQuery({
    queryKey: ["all-journal-entries", params],
    queryFn: () => supervisorApi.getAllJournalEntries(params),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: 2,
  });
}
