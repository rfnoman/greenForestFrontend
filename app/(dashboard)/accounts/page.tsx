"use client";

import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountFormDialog } from "@/components/forms/account-form";
import type { Account, AccountType } from "@/lib/types";

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType | "all">("all");

  const filteredAccounts = accounts?.filter(
    (account) => selectedType === "all" || account.account_type === selectedType
  );

  const groupedAccounts = filteredAccounts?.reduce((acc, account) => {
    const type = account.account_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  if (isLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">
            Manage your accounting chart of accounts
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      <Tabs
        value={selectedType}
        onValueChange={(v) => setSelectedType(v as AccountType | "all")}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {ACCOUNT_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {selectedType === "all" ? (
            <div className="grid gap-6">
              {ACCOUNT_TYPES.map((type) => {
                const typeAccounts = groupedAccounts?.[type.value] || [];
                if (typeAccounts.length === 0) return null;

                return (
                  <Card key={type.value}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {type.label} Accounts
                      </CardTitle>
                      <CardDescription>
                        {typeAccounts.length} account
                        {typeAccounts.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AccountList accounts={typeAccounts} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{selectedType} Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountList accounts={filteredAccounts || []} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AccountFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function AccountList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No accounts found</p>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <a
          key={account.id}
          href={`/accounts/${account.id}`}
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="font-mono text-sm text-muted-foreground w-16">
              {account.code}
            </div>
            <div>
              <div className="font-medium">{account.name}</div>
              {account.description && (
                <div className="text-sm text-muted-foreground">
                  {account.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account.is_system && (
              <Badge variant="secondary">System</Badge>
            )}
            {!account.is_active && (
              <Badge variant="outline">Inactive</Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </a>
      ))}
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
