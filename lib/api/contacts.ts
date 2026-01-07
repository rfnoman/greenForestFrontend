import { apiClient } from "./client";
import type { Contact, CreateContactInput, ContactType } from "@/lib/types";

export interface ContactsListParams {
  contact_type?: ContactType;
  is_active?: string;
}

export const contactsApi = {
  list: (params?: ContactsListParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.contact_type) queryParams.contact_type = params.contact_type;
    if (params?.is_active) queryParams.is_active = params.is_active;
    return apiClient.get<Contact[]>("/contacts", queryParams);
  },

  get: (id: string) => apiClient.get<Contact>(`/contacts/${id}`),

  create: (data: CreateContactInput) => apiClient.post<Contact>("/contacts", data),

  update: (id: string, data: Partial<CreateContactInput>) =>
    apiClient.patch<Contact>(`/contacts/${id}`, data),

  delete: (id: string) => apiClient.delete(`/contacts/${id}`),

  listCustomers: () => apiClient.get<Contact[]>("/contacts/customers"),

  listVendors: () => apiClient.get<Contact[]>("/contacts/vendors"),
};
