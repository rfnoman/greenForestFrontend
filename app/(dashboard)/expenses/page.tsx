"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Trash2, Eye, Receipt } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "@/lib/api/expenses";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
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
import type { Expense } from "@/lib/types";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { currentBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.list(),
  });
  const deleteExpense = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const currency = currentBusiness?.currency || "USD";

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense.mutateAsync(deletingExpense.id);
      toast.success("Expense deleted successfully");
      setDeletingExpense(null);
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    { accessorKey: "category_name", header: "Category" },
    {
      accessorKey: "vendor_name",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor_name || "-",
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
      accessorKey: "receipt_url",
      header: "Receipt",
      cell: ({ row }) =>
        row.original.receipt_url ? (
          <a href={row.original.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            <Receipt className="h-4 w-4" />
          </a>
        ) : "-",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingExpense(row.original)}>
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
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">Track business expenses</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track business expenses</p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="mr-2 h-4 w-4" />Record Expense
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={expenses || []} searchKey="description" searchPlaceholder="Search expenses..." />

      <AlertDialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
