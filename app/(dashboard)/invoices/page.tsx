"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Send, DollarSign, Ban, Eye } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useInvoices, useSendInvoice, useVoidInvoice } from "@/lib/hooks/use-invoices";
import { useBusiness } from "@/lib/hooks/use-business";
import { INVOICE_STATUSES } from "@/lib/constants";
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
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "all">("all");
  const { currentBusiness } = useBusiness();
  const { data: invoices, isLoading } = useInvoices(
    selectedStatus === "all" ? undefined : { status: selectedStatus }
  );
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const [voidingInvoice, setVoidingInvoice] = useState<Invoice | null>(null);

  const currency = currentBusiness?.currency || "USD";

  const handleSend = async (invoice: Invoice) => {
    try {
      await sendInvoice.mutateAsync(invoice.id);
      toast.success("Invoice sent successfully");
    } catch {
      toast.error("Failed to send invoice");
    }
  };

  const handleVoid = async () => {
    if (!voidingInvoice) return;
    try {
      await voidInvoice.mutateAsync({ id: voidingInvoice.id });
      toast.success("Invoice voided successfully");
      setVoidingInvoice(null);
    } catch {
      toast.error("Failed to void invoice");
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = INVOICE_STATUSES.find((s) => s.value === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "default";
    switch (status) {
      case "paid":
        variant = "success";
        break;
      case "sent":
        variant = "default";
        break;
      case "overdue":
        variant = "destructive";
        break;
      case "draft":
      case "voided":
        variant = "secondary";
        break;
    }

    return <Badge variant={variant}>{statusConfig.label}</Badge>;
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoice_number",
      header: "Invoice #",
      cell: ({ row }) => (
        <Link
          href={`/invoices/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.invoice_number}
        </Link>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
    },
    {
      accessorKey: "issue_date",
      header: "Issue Date",
      cell: ({ row }) => formatDate(row.original.issue_date),
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
        <span
          className={
            parseFloat(row.original.balance_due) > 0 ? "font-medium" : ""
          }
        >
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
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${invoice.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              {invoice.status === "draft" && (
                <DropdownMenuItem onClick={() => handleSend(invoice)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </DropdownMenuItem>
              )}
              {(invoice.status === "sent" || invoice.status === "overdue") && (
                <DropdownMenuItem asChild>
                  <Link href={`/invoices/${invoice.id}?action=payment`}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Link>
                </DropdownMenuItem>
              )}
              {invoice.status !== "voided" && invoice.status !== "paid" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setVoidingInvoice(invoice)}
                  >
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
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Manage customer invoices
            </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage customer invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <Tabs
        value={selectedStatus}
        onValueChange={(v) => setSelectedStatus(v as InvoiceStatus | "all")}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {INVOICE_STATUSES.map((status) => (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={selectedStatus} className="mt-4">
          <DataTable
            columns={columns}
            data={invoices || []}
            searchKey="customer_name"
            searchPlaceholder="Search by customer..."
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!voidingInvoice} onOpenChange={() => setVoidingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void invoice #{voidingInvoice?.invoice_number}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
