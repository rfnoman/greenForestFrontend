"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, DollarSign, Ban, Printer } from "lucide-react";
import { useInvoice, useSendInvoice, useVoidInvoice } from "@/lib/hooks/use-invoices";
import { useBusiness } from "@/lib/hooks/use-business";
import { INVOICE_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
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
import { PaymentFormDialog } from "@/components/forms/payment-form";
import { toast } from "sonner";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentBusiness } = useBusiness();
  const { data: invoice, isLoading } = useInvoice(id);
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const [showPayment, setShowPayment] = useState(false);
  const [showVoid, setShowVoid] = useState(false);

  const currency = currentBusiness?.currency || "USD";

  const handleSend = async () => {
    try {
      await sendInvoice.mutateAsync(id);
      toast.success("Invoice sent successfully");
    } catch {
      toast.error("Failed to send invoice");
    }
  };

  const handleVoid = async () => {
    try {
      await voidInvoice.mutateAsync({ id });
      toast.success("Invoice voided successfully");
      setShowVoid(false);
    } catch {
      toast.error("Failed to void invoice");
    }
  };

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Button className="mt-4" asChild>
          <Link href="/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = INVOICE_STATUSES.find((s) => s.value === invoice.status);
  let statusVariant: "default" | "success" | "warning" | "destructive" | "secondary" = "default";
  switch (invoice.status) {
    case "paid": statusVariant = "success"; break;
    case "overdue": statusVariant = "destructive"; break;
    case "draft":
    case "voided": statusVariant = "secondary"; break;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice #{invoice.invoice_number}
            </h1>
            <Badge variant={statusVariant}>{statusConfig?.label}</Badge>
          </div>
          <p className="text-muted-foreground">{invoice.customer_name}</p>
        </div>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button onClick={handleSend} disabled={sendInvoice.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button onClick={() => setShowPayment(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {invoice.status !== "voided" && invoice.status !== "paid" && (
            <Button variant="destructive" onClick={() => setShowVoid(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Void
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issue Date</span>
              <span>{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            {invoice.sent_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent</span>
                <span>{formatDate(invoice.sent_at)}</span>
              </div>
            )}
            {invoice.paid_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span>{formatDate(invoice.paid_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, currency)}</span>
            </div>
            {parseFloat(invoice.discount_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(invoice.discount_amount, currency)}</span>
              </div>
            )}
            {parseFloat(invoice.tax_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax ({invoice.tax_rate}%)
                </span>
                <span>{formatCurrency(invoice.tax_amount, currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="text-green-600">
                {formatCurrency(invoice.amount_paid, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Due</span>
              <span
                className={
                  parseFloat(invoice.balance_due) > 0
                    ? "text-red-600 font-bold"
                    : ""
                }
              >
                {formatCurrency(invoice.balance_due, currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.line_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.amount, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Subtotal
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(invoice.subtotal, currency)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="capitalize">
                      {PAYMENT_METHODS.find((m) => m.value === payment.payment_method)?.label ||
                        payment.payment_method}
                    </TableCell>
                    <TableCell>{payment.reference || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(payment.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(invoice.notes || invoice.terms) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes & Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {invoice.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="font-medium mb-2">Terms & Conditions</h4>
                <p className="text-muted-foreground">{invoice.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PaymentFormDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        invoiceId={id}
        balanceDue={invoice.balance_due}
        currency={currency}
      />

      <AlertDialog open={showVoid} onOpenChange={setShowVoid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this invoice? This action cannot be undone.
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

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
