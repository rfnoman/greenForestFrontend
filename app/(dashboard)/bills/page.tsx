"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, DollarSign, Ban, Eye } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useBills, useVoidBill } from "@/lib/hooks/use-bills";
import { useBusiness } from "@/lib/hooks/use-business";
import { BILL_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { Bill, BillStatus } from "@/lib/types";
import { toast } from "sonner";

export default function BillsPage() {
  const [selectedStatus, setSelectedStatus] = useState<BillStatus | "all">("all");
  const { currentBusiness } = useBusiness();
  const { data: bills, isLoading } = useBills(
    selectedStatus === "all" ? undefined : { status: selectedStatus }
  );
  const voidBill = useVoidBill();
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);

  const currency = currentBusiness?.currency || "USD";

  const handleVoid = async () => {
    if (!voidingBill) return;
    try {
      await voidBill.mutateAsync({ id: voidingBill.id });
      toast.success("Bill voided successfully");
      setVoidingBill(null);
    } catch {
      toast.error("Failed to void bill");
    }
  };

  const getStatusBadge = (status: BillStatus) => {
    let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "default";
    switch (status) {
      case "paid": variant = "success"; break;
      case "pending": variant = "warning"; break;
      case "overdue": variant = "destructive"; break;
      case "draft":
      case "voided": variant = "secondary"; break;
    }
    const statusConfig = BILL_STATUSES.find((s) => s.value === status);
    return <Badge variant={variant}>{statusConfig?.label || status}</Badge>;
  };

  const columns: ColumnDef<Bill>[] = [
    {
      accessorKey: "bill_number",
      header: "Bill #",
      cell: ({ row }) => (
        <Link href={`/bills/${row.original.id}`} className="font-medium hover:underline">
          {row.original.bill_number}
        </Link>
      ),
    },
    { accessorKey: "vendor_name", header: "Vendor" },
    {
      accessorKey: "bill_date",
      header: "Bill Date",
      cell: ({ row }) => formatDate(row.original.bill_date),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.original.due_date),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => formatCurrency(row.original.total, currency),
    },
    {
      accessorKey: "balance_due",
      header: "Balance Due",
      cell: ({ row }) => (
        <span className={parseFloat(row.original.balance_due) > 0 ? "font-medium" : ""}>
          {formatCurrency(row.original.balance_due, currency)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const bill = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/bills/${bill.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              {(bill.status === "pending" || bill.status === "overdue") && (
                <DropdownMenuItem asChild>
                  <Link href={`/bills/${bill.id}?action=payment`}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Link>
                </DropdownMenuItem>
              )}
              {bill.status !== "voided" && bill.status !== "paid" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setVoidingBill(bill)}>
                    <Ban className="h-4 w-4 mr-2" />
                    Void
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
            <p className="text-muted-foreground">Manage vendor bills</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">Manage vendor bills</p>
        </div>
        <Button asChild>
          <Link href="/bills/new">
            <Plus className="mr-2 h-4 w-4" />
            New Bill
          </Link>
        </Button>
      </div>

      <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as BillStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {BILL_STATUSES.map((status) => (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={selectedStatus} className="mt-4">
          <DataTable columns={columns} data={bills || []} searchKey="vendor_name" searchPlaceholder="Search by vendor..." />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!voidingBill} onOpenChange={() => setVoidingBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void bill #{voidingBill?.bill_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoid} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Void Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
