"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi, AccountsListParams } from "@/lib/api/accounts";
import type { CreateAccountInput, SetOpeningBalanceInput } from "@/lib/types";
import { useBusiness } from "./use-business";

export function useAccounts(params?: AccountsListParams) {
  const { currentBusiness } = useBusiness();
  return useQuery({
    queryKey: ["accounts", currentBusiness?.id, params],
    queryFn: () => accountsApi.list(params),
    enabled: !!currentBusiness,
  });
}

export function useAccount(id: string) {
  const { currentBusiness } = useBusiness();
  return useQuery({
    queryKey: ["accounts", currentBusiness?.id, id],
    queryFn: () => accountsApi.get(id),
    enabled: !!id && !!currentBusiness,
  });
}

export function useAccountBalance(id: string) {
  const { currentBusiness } = useBusiness();
  return useQuery({
    queryKey: ["accounts", currentBusiness?.id, id, "balance"],
    queryFn: () => accountsApi.getBalance(id),
    enabled: !!id && !!currentBusiness,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountInput) => accountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountInput> }) =>
      accountsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["accounts", id] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useSetOpeningBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetOpeningBalanceInput }) =>
      accountsApi.setOpeningBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useAccountStatement(
  id: string,
  params: { from_date: string; to_date: string; page?: number; page_size?: number }
) {
  const { currentBusiness } = useBusiness();
  return useQuery({
    queryKey: ["accounts", currentBusiness?.id, id, "statement", params],
    queryFn: () => accountsApi.getStatement(id, params),
    enabled: !!id && !!currentBusiness && !!params.from_date && !!params.to_date,
  });
}

export function useClearOpeningBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.clearOpeningBalance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
