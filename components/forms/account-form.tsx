"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAccounts, useCreateAccount, useUpdateAccount } from "@/lib/hooks/use-accounts";
import { accountSchema, AccountFormData } from "@/lib/utils/validation";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account } from "@/lib/types";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: AccountFormDialogProps) {
  const { data: accounts } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          code: account.code,
          name: account.name,
          description: account.description || "",
          account_type: account.account_type,
          parent_id: account.parent_id || "",
        }
      : {
          code: "",
          name: "",
          description: "",
          account_type: "asset",
          parent_id: "",
        },
  });

  const isLoading = createAccount.isPending || updateAccount.isPending;

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (account) {
        await updateAccount.mutateAsync({
          id: account.id,
          data: {
            ...data,
            parent_id: data.parent_id || undefined,
          },
        });
        toast.success("Account updated successfully");
      } else {
        await createAccount.mutateAsync({
          ...data,
          parent_id: data.parent_id || undefined,
        });
        toast.success("Account created successfully");
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(account ? "Failed to update account" : "Failed to create account");
    }
  };

  const parentAccounts = accounts?.filter(
    (a) =>
      a.account_type === form.watch("account_type") &&
      a.id !== account?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {account
              ? "Update the account details below."
              : "Add a new account to your chart of accounts."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Code</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Cash" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Account (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No parent account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent account</SelectItem>
                      {parentAccounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Account description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {account ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
