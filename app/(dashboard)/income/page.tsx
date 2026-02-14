"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Trash2, Receipt, Banknote } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { incomesApi } from "@/lib/api/incomes";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { INCOME_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import type { Income } from "@/lib/types";
import { toast } from "sonner";

export default function IncomePage() {
  const { currentBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const { data: incomes, isLoading } = useQuery({
    queryKey: ["incomes"],
    queryFn: () => incomesApi.list(),
  });
  const deleteIncome = useMutation({
    mutationFn: (id: string) => incomesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes"] }),
  });
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);

  const currency = currentBusiness?.currency || "USD";

  const getIncomeTypeLabel = (value: string) => {
    return INCOME_TYPES.find((t) => t.value === value)?.label || value;
  };

  const handleDelete = async () => {
    if (!deletingIncome) return;
    try {
      await deleteIncome.mutateAsync(deletingIncome.id);
      toast.success("Income deleted successfully");
      setDeletingIncome(null);
    } catch {
      toast.error("Failed to delete income");
    }
  };

  const columns: ColumnDef<Income>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "income_type",
      header: "Type",
      cell: ({ row }) => getIncomeTypeLabel(row.original.income_type),
    },
    { accessorKey: "category_name", header: "Category" },
    {
      accessorKey: "contact_name",
      header: "Contact",
      cell: ({ row }) => row.original.contact_name || "-",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount, currency),
    },
    {
      id: "payment",
      header: "Payment",
      cell: ({ row }) =>
        row.original.bank_account_id ? (
          <span className="text-muted-foreground">Bank Deposit</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Banknote className="h-3.5 w-3.5" />Cash
          </span>
        ),
    },
    {
      id: "receipt",
      header: "Receipt",
      cell: ({ row }) => {
        const fileUrl = row.original.receipt_file_url;
        const externalUrl = row.original.receipt_url;
        if (fileUrl) {
          return (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              <Receipt className="h-4 w-4" />
            </a>
          );
        }
        if (externalUrl) {
          return (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              <Receipt className="h-4 w-4" />
            </a>
          );
        }
        return "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingIncome(row.original)}>
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </DropdownMenuItem>
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
            <h1 className="text-3xl font-bold tracking-tight">Income</h1>
            <p className="text-muted-foreground">Track other income sources</p>
          </div>
        </div>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">Track other income sources</p>
        </div>
        <Button asChild>
          <Link href="/income/new">
            <Plus className="mr-2 h-4 w-4" />Record Income
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={incomes || []} searchKey="description" searchPlaceholder="Search income..." />

      <AlertDialog open={!!deletingIncome} onOpenChange={() => setDeletingIncome(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
