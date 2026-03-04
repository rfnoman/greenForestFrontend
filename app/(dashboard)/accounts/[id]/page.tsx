"use client";

import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Edit, Loader2, DollarSign, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAccount, useAccountBalance, useSetOpeningBalance, useClearOpeningBalance } from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils/format";
import { useBusiness } from "@/lib/hooks/use-business";
import { openingBalanceSchema, OpeningBalanceFormData } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AccountFormDialog } from "@/components/forms/account-form";
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

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentBusiness } = useBusiness();
  const { data: account, isLoading } = useAccount(id);
  const { data: balanceData } = useAccountBalance(id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);

  if (isLoading) {
    return <AccountDetailSkeleton />;
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Account not found</h2>
        <p className="text-muted-foreground mt-2">
          The account you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/accounts">Back to Accounts</Link>
        </Button>
      </div>
    );
  }

  const currency = currentBusiness?.currency || "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-muted-foreground">Account Code: {account.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/accounts/${id}/statement`}>
              <FileText className="mr-2 h-4 w-4" />
              View Statement
            </Link>
          </Button>
          <Button onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize font-medium">{account.account_type}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Normal Balance</span>
              <span className="capitalize font-medium">{account.normal_balance}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={account.is_active ? "success" : "secondary"}>
                {account.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {account.is_system && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Account</span>
                  <Badge variant="secondary">Yes</Badge>
                </div>
              </>
            )}
            {account.description && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Description</span>
                  <p className="mt-1">{account.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
              <CardDescription>Current account balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {formatCurrency(balanceData?.balance || "0", currency)}
              </div>
              {balanceData?.as_of_date && (
                <p className="text-sm text-muted-foreground mt-2">
                  As of {new Date(balanceData.as_of_date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opening Balance</CardTitle>
              <CardDescription>Initial balance for this account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(account.opening_balance ?? 0, currency)}
              </div>
              {account.opening_balance_date ? (
                <p className="text-sm text-muted-foreground mt-1">
                  As of {new Date(account.opening_balance_date).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">&mdash;</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsBalanceOpen(true)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Update Balance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AccountFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={account}
      />

      <OpeningBalanceDialog
        open={isBalanceOpen}
        onOpenChange={setIsBalanceOpen}
        accountId={account.id}
        currentBalance={account.opening_balance}
        currentDate={account.opening_balance_date}
      />
    </div>
  );
}

function OpeningBalanceDialog({
  open,
  onOpenChange,
  accountId,
  currentBalance,
  currentDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  currentBalance: number | null;
  currentDate: string | null;
}) {
  const setOpeningBalance = useSetOpeningBalance();
  const clearOpeningBalance = useClearOpeningBalance();

  const form = useForm<OpeningBalanceFormData>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      opening_balance: currentBalance ? String(currentBalance) : "0",
      opening_balance_date: currentDate || "",
    },
  });

  // Reset form values when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        opening_balance: currentBalance ? String(currentBalance) : "0",
        opening_balance_date: currentDate || "",
      });
    }
    onOpenChange(isOpen);
  };

  const isLoading = setOpeningBalance.isPending || clearOpeningBalance.isPending;

  const onSubmit = async (data: OpeningBalanceFormData) => {
    try {
      const result = await setOpeningBalance.mutateAsync({
        id: accountId,
        data: {
          opening_balance: parseFloat(data.opening_balance),
          opening_balance_date: data.opening_balance_date,
        },
      });
      const jeNumber = result.journal_entry_number;
      toast.success(
        jeNumber
          ? `Opening balance set. Journal entry ${jeNumber} created.`
          : "Opening balance updated successfully"
      );
      handleOpenChange(false);
    } catch {
      toast.error("Failed to update opening balance");
    }
  };

  const onClear = async () => {
    try {
      await clearOpeningBalance.mutateAsync(accountId);
      toast.success("Opening balance cleared");
      handleOpenChange(false);
    } catch {
      toast.error("Failed to clear opening balance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Opening Balance</DialogTitle>
          <DialogDescription>
            Set or update the opening balance for this account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="opening_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opening_balance_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Balance Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={onClear}
                disabled={isLoading || (!currentBalance && !currentDate)}
              >
                {clearOpeningBalance.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Clear Balance
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {setOpeningBalance.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-40" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24 mt-2" />
              <Skeleton className="h-9 w-36 mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
