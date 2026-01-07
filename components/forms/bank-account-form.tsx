"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { bankAccountSchema, BankAccountFormData } from "@/lib/utils/validation";
import { BANK_ACCOUNT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BankAccount } from "@/lib/types";

interface BankAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount?: BankAccount;
}

export function BankAccountFormDialog({ open, onOpenChange, bankAccount }: BankAccountFormDialogProps) {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts({ account_type: "asset" });
  const bankGLAccounts = accounts?.filter((a) => a.is_bank_account || a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bank"));

  const createAccount = useMutation({
    mutationFn: (data: BankAccountFormData) => bankAccountsApi.create({
      name: data.name,
      account_type: data.account_type,
      bank_name: data.bank_name || undefined,
      account_number_last4: data.account_number_last4 || undefined,
      gl_account_id: data.gl_account_id,
      opening_balance: data.opening_balance,
      opening_balance_date: data.opening_balance_date,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountFormData> }) => bankAccountsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: bankAccount ? {
      name: bankAccount.name,
      account_type: bankAccount.account_type,
      bank_name: bankAccount.bank_name || "",
      account_number_last4: bankAccount.account_number_last4 || "",
      gl_account_id: bankAccount.gl_account_id,
      opening_balance: bankAccount.opening_balance,
      opening_balance_date: bankAccount.opening_balance_date,
    } : {
      name: "",
      account_type: "checking",
      bank_name: "",
      account_number_last4: "",
      gl_account_id: "",
      opening_balance: "0",
      opening_balance_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const isLoading = createAccount.isPending || updateAccount.isPending;

  const onSubmit = async (data: BankAccountFormData) => {
    try {
      if (bankAccount) {
        await updateAccount.mutateAsync({ id: bankAccount.id, data });
        toast.success("Bank account updated");
      } else {
        await createAccount.mutateAsync(data);
        toast.success("Bank account created");
      }
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error(bankAccount ? "Failed to update account" : "Failed to create account");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bankAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
          <DialogDescription>{bankAccount ? "Update the bank account details." : "Add a new bank account to track."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl><Input placeholder="Main Checking" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="account_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {BANK_ACCOUNT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="bank_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl><Input placeholder="Bank of America" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="account_number_last4" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last 4 Digits</FormLabel>
                  <FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="gl_account_id" render={({ field }) => (
              <FormItem>
                <FormLabel>GL Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select GL account" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {bankGLAccounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="opening_balance" render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Balance</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="opening_balance_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>As Of Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {bankAccount ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
