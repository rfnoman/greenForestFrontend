import { apiClient } from "./client";
import type {
  User,
  Business,
  JournalEntry,
  JournalEntryWithBusiness,
} from "@/lib/types";

class SupervisorApi {
  /**
   * Fetch all draft journal entries across all businesses
   * This aggregates data by impersonating each owner and fetching their businesses' draft entries
   */
  async getAllDraftJournalEntries(): Promise<JournalEntryWithBusiness[]> {
    try {
      // 1. Get all owners
      // Note: Backend must allow accountant_supervisor to access this endpoint
      const owners = await apiClient.get<User[]>("/users/owners");
      const allEntries: JournalEntryWithBusiness[] = [];

      // Store original state to restore later
      const originalToken = apiClient.getAccessToken();
      const originalBusinessId = apiClient.getBusinessId();

      // 2. For each owner, fetch their businesses and journal entries
      for (const owner of owners) {
        try {
          // Impersonate to access owner's data
          const impersonateResponse = await apiClient.post<{
            access: string;
            refresh: string;
            user: User;
          }>("/users/impersonate", {
            email: owner.email,
          });

          // Temporarily set impersonated token
          apiClient.setAccessToken(impersonateResponse.access);

          // Get owner's businesses
          const businesses = await apiClient.get<Business[]>("/businesses");

          // For each business, fetch draft entries
          for (const business of businesses) {
            try {
              apiClient.setBusinessId(business.id);
              const entries = await apiClient.get<JournalEntry[]>(
                "/journal-entries",
                { status: "draft" }
              );

              // Enrich entries with business/owner info
              allEntries.push(
                ...entries.map((entry) => ({
                  ...entry,
                  business_id: business.id,
                  business_name: business.name,
                  owner_id: owner.id,
                  owner_name: `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || owner.username,
                  owner_email: owner.email,
                }))
              );
            } catch (error) {
              console.error(
                `Failed to fetch entries for business ${business.name}:`,
                error
              );
              // Continue with other businesses
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch entries for owner ${owner.email}:`,
            error
          );
          // Continue with other owners
        }
      }

      // Restore original state
      apiClient.setAccessToken(originalToken);
      if (originalBusinessId) {
        apiClient.setBusinessId(originalBusinessId);
      }

      // Sort by created_at desc (most recent first)
      return allEntries.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error("Failed to fetch draft journal entries:", error);
      // Check if it's a permission error
      if (error instanceof Error && error.message.includes("Only accountants")) {
        throw new Error(
          "Backend permission error: The /users/owners and /users/impersonate endpoints need to allow 'accountant_supervisor' user type. " +
          "Please update the backend API to grant accountant_supervisor the same permissions as accountant for these endpoints."
        );
      }
      throw error;
    }
  }

  /**
   * Post a journal entry (change status from draft to posted)
   * Requires setting the correct business context
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
      // Restore original business context
      if (originalBusinessId) {
        apiClient.setBusinessId(originalBusinessId);
      }
    }
  }

  /**
   * Get a single journal entry with business context
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
      if (originalBusinessId) {
        apiClient.setBusinessId(originalBusinessId);
      }
    }
  }
}

export const supervisorApi = new SupervisorApi();
