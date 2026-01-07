"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactsApi, ContactsListParams } from "@/lib/api/contacts";
import type { CreateContactInput } from "@/lib/types";

export function useContacts(params?: ContactsListParams) {
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: () => contactsApi.list(params),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["contacts", "customers"],
    queryFn: () => contactsApi.listCustomers(),
  });
}

export function useVendors() {
  return useQuery({
    queryKey: ["contacts", "vendors"],
    queryFn: () => contactsApi.listVendors(),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactInput) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactInput> }) =>
      contactsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
