"use client";

import { useState, useMemo } from "react";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountFormDialog } from "@/components/forms/account-form";
import type { Account, AccountType } from "@/lib/types";

interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
  depth: number;
}

function buildAccountTree(accounts: Account[]): AccountTreeNode[] {
  const accountMap = new Map<string, AccountTreeNode>();
  const roots: AccountTreeNode[] = [];

  // Create tree nodes
  for (const account of accounts) {
    accountMap.set(account.id, { ...account, children: [], depth: 0 });
  }

  // Build tree
  for (const account of accounts) {
    const node = accountMap.get(account.id)!;
    if (account.parent_id && accountMap.has(account.parent_id)) {
      const parent = accountMap.get(account.parent_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Set depths
  function setDepth(nodes: AccountTreeNode[], depth: number) {
    for (const node of nodes) {
      node.depth = depth;
      setDepth(node.children, depth + 1);
    }
  }
  setDepth(roots, 0);

  // Sort by code at each level
  function sortNodes(nodes: AccountTreeNode[]) {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    for (const node of nodes) {
      sortNodes(node.children);
    }
  }
  sortNodes(roots);

  return roots;
}

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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);

  if (accounts.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No accounts found</p>
    );
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderNode(node: AccountTreeNode) {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          style={{ marginLeft: node.depth * 24 }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleCollapse(node.id);
                }}
                className="p-0.5 rounded hover:bg-muted"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div className="font-mono text-sm text-muted-foreground w-16">
              {node.code}
            </div>
            <a href={`/accounts/${node.id}`} className="hover:underline">
              <div className="font-medium">{node.name}</div>
              {node.description && (
                <div className="text-sm text-muted-foreground">
                  {node.description}
                </div>
              )}
            </a>
          </div>
          <div className="flex items-center gap-2">
            {node.is_system && (
              <Badge variant="secondary">System</Badge>
            )}
            {!node.is_active && (
              <Badge variant="outline">Inactive</Badge>
            )}
            <a href={`/accounts/${node.id}`}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => renderNode(node))}
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
