import { apiClient } from "./client";
import type {
  BusinessSearch,
  ChatAttachment,
  ChatSessionDetail,
  JournalEntry,
  JournalEntryWithBusiness,
  PaginatedResponse,
  SupervisorDashboardData,
} from "@/lib/types";

export interface AllJournalEntriesParams {
  page?: number;
  page_size?: number;
  status?: string;
  source_type?: string;
  business_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

class SupervisorApi {
  /**
   * Fetch supervisor dashboard data (system-wide overview).
   * No X-Business-ID required.
   */
  async getDashboard(): Promise<SupervisorDashboardData> {
    return apiClient.get<SupervisorDashboardData>("/reports/supervisor-dashboard");
  }

  /**
   * Fetch paginated journal entries across all businesses.
   * Uses the dedicated /all-journal-entries endpoint (no impersonation needed).
   */
  async getAllJournalEntries(
    params?: AllJournalEntriesParams
  ): Promise<PaginatedResponse<JournalEntryWithBusiness>> {
    const queryParams: Record<string, string> = {};

    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();
    if (params?.status) queryParams.status = params.status;
    if (params?.source_type) queryParams.source_type = params.source_type;
    if (params?.business_id) queryParams.business_id = params.business_id;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;

    return apiClient.get<PaginatedResponse<JournalEntryWithBusiness>>(
      "/all-journal-entries",
      queryParams
    );
  }

  /**
   * Post a journal entry (change status from draft to posted).
   * Requires setting the correct business context.
   */
  async postJournalEntry(
    entryId: string,
    businessId: string
  ): Promise<JournalEntry> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      const result = await apiClient.post<JournalEntry>(
        `/journal-entries/${entryId}/post`
      );
      return result;
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Ask for review on a journal entry (change status to ask_for_review).
   * Requires setting the correct business context.
   */
  async askForReviewJournalEntry(
    entryId: string,
    businessId: string
  ): Promise<JournalEntry> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      const result = await apiClient.post<JournalEntry>(
        `/journal-entries/${entryId}/ask-for-review`
      );
      return result;
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Get a single journal entry with business context.
   */
  async getJournalEntry(
    entryId: string,
    businessId: string
  ): Promise<JournalEntry> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      const entry = await apiClient.get<JournalEntry>(
        `/journal-entries/${entryId}`
      );
      return entry;
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Get chat session details (messages) for a journal entry's linked chat.
   */
  async getChatSession(
    sessionId: string,
    businessId: string
  ): Promise<ChatSessionDetail> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      return await apiClient.get<ChatSessionDetail>(
        `/chat/sessions/${sessionId}`
      );
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Get chat file attachments for a given session.
   */
  async getChatFiles(
    sessionId: string,
    businessId: string
  ): Promise<ChatAttachment[]> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      return await apiClient.get<ChatAttachment[]>("/chat/files", {
        session_id: sessionId,
      });
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Update a journal entry (draft or ask_for_review).
   * Requires setting the correct business context.
   */
  async updateJournalEntry(
    entryId: string,
    businessId: string,
    data: Partial<import("@/lib/types").CreateJournalEntryInput>
  ): Promise<JournalEntry> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      const result = await apiClient.put<JournalEntry>(
        `/journal-entries/${entryId}`,
        data
      );
      return result;
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Get accounts list for a specific business context.
   */
  async getAccounts(businessId: string): Promise<import("@/lib/types").Account[]> {
    const originalBusinessId = apiClient.getBusinessId();

    try {
      apiClient.setBusinessId(businessId);
      return await apiClient.get<import("@/lib/types").Account[]>("/accounts");
    } finally {
      apiClient.setBusinessId(originalBusinessId);
    }
  }

  /**
   * Search all businesses (accountants & supervisors only).
   */
  async searchBusinesses(params?: {
    q?: string;
    is_active?: boolean;
  }): Promise<BusinessSearch[]> {
    const queryParams: Record<string, string> = {};
    if (params?.q) queryParams.q = params.q;
    if (params?.is_active !== undefined) queryParams.is_active = params.is_active.toString();

    return apiClient.get<BusinessSearch[]>("/businesses/search/all", queryParams);
  }

  /**
   * Get download URL for a chat file attachment.
   */
  getChatFileDownloadUrl(fileId: string, businessId: string): string {
    const accessToken = apiClient.getAccessToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    return `${apiBase}/chat/files/${fileId}/download?token=${accessToken}&business_id=${businessId}`;
  }
}

export const supervisorApi = new SupervisorApi();
