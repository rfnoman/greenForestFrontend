"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Tag } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { bankTransactionsApi } from "@/lib/api/bank-transactions";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import type { BankTransaction } from "@/lib/types";

export default function BankTransactionsPage() {
  const { currentBusiness } = useBusiness();
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["bank-transactions", selectedAccount === "all" ? {} : { bank_account_id: selectedAccount }],
    queryFn: () => bankTransactionsApi.list(selectedAccount === "all" ? undefined : { bank_account_id: selectedAccount }),
  });
  const currency = currentBusiness?.currency || "USD";

  const columns: ColumnDef<BankTransaction>[] = [
    { accessorKey: "transaction_date", header: "Date", cell: ({ row }) => formatDate(row.original.transaction_date) },
    { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description || "-" },
    { accessorKey: "reference", header: "Reference", cell: ({ row }) => row.original.reference || "-" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount);
        return (
          <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(row.original.amount, currency)}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.account_id ? (
            <Badge variant="success">Categorized</Badge>
          ) : (
            <Badge variant="secondary">Uncategorized</Badge>
          )}
          {row.original.is_reconciled && <Badge variant="outline">Reconciled</Badge>}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Tag className="h-4 w-4 mr-2" />Categorize</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">View and categorize bank transactions</p>
          </div>
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View and categorize bank transactions</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Transaction</Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {bankAccounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={transactions || []} searchKey="description" searchPlaceholder="Search transactions..." />
    </div>
  );
}
