"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Edit, Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { BANK_ACCOUNT_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BankAccountFormDialog } from "@/components/forms/bank-account-form";
import type { BankAccount } from "@/lib/types";

export default function BankAccountsPage() {
  const { currentBusiness } = useBusiness();
  const { data: bankAccounts, isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const currency = currentBusiness?.currency || "USD";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage your bank accounts</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-40" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bankAccounts?.map((account) => {
          const typeLabel = BANK_ACCOUNT_TYPES.find((t) => t.value === account.account_type)?.label;
          return (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    {account.name}
                  </CardTitle>
                  <CardDescription>
                    {account.bank_name || typeLabel}
                    {account.account_number_last4 && ` ****${account.account_number_last4}`}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditAccount(account)}>
                      <Edit className="h-4 w-4 mr-2" />Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(account.current_balance, currency)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">{typeLabel}</Badge>
                  {!account.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!bankAccounts || bankAccounts.length === 0) && (
        <Card className="p-12 text-center">
          <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No bank accounts</h3>
          <p className="text-muted-foreground mb-4">Add your first bank account to start tracking transactions.</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Bank Account
          </Button>
        </Card>
      )}

      <BankAccountFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {editAccount && (
        <BankAccountFormDialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)} bankAccount={editAccount} />
      )}
    </div>
  );
}
