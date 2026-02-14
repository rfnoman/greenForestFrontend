import { apiClient } from "./client";
import type { Business, BusinessMember, Address } from "@/lib/types";

export interface CreateBusinessInput {
  name: string;
  industry?: string;
  currency: string;
  fiscal_year_end_month: number;
  email?: string;
  phone?: string;
  tax_id?: string;
  address?: Address;
}

export interface InviteMemberInput {
  email: string;
  role: "owner" | "manager";
}

export const businessesApi = {
  list: () => apiClient.get<Business[]>("/businesses"),

  get: (id: string) => apiClient.get<Business>(`/businesses/${id}`),

  create: (data: CreateBusinessInput) => apiClient.post<Business>("/businesses", data),

  update: (id: string, data: Partial<CreateBusinessInput>) =>
    apiClient.patch<Business>(`/businesses/${id}`, data),

  getMembers: (id: string) => apiClient.get<BusinessMember[]>(`/businesses/${id}/members`),

  inviteMember: (id: string, email: string, role: "owner" | "manager") =>
    apiClient.post<BusinessMember>(`/businesses/${id}/members/invite/`, { email, role }),

  removeMember: (businessId: string, userId: string) =>
    apiClient.delete(`/businesses/${businessId}/members/${userId}`),
};
