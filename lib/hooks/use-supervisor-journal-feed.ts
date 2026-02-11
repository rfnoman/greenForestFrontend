"use client";

import { useQuery } from "@tanstack/react-query";
import { supervisorApi } from "@/lib/api/supervisor";

/**
 * Hook to fetch and poll draft journal entries across all businesses
 * Polls every 30 seconds and refetches on window focus
 */
export function useSupervisorJournalFeed() {
  return useQuery({
    queryKey: ["supervisor-journal-feed"],
    queryFn: () => supervisorApi.getAllDraftJournalEntries(),
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true, // Refetch when tab becomes active
    staleTime: 20000, // Consider data stale after 20 seconds
    retry: 2, // Retry failed requests twice
  });
}
