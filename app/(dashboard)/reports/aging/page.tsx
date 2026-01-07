"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Printer, Clock, AlertTriangle } from "lucide-react";
import { reportsApi } from "@/lib/api/reports";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AgingPage() {
  const { currentBusiness } = useBusiness();
  const currency = currentBusiness?.currency || "USD";

  const { data: invoiceAging, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["reports", "invoice-aging"],
    queryFn: () => reportsApi.getInvoiceAging(),
  });

  const { data: billAging, isLoading: isLoadingBills } = useQuery({
    queryKey: ["reports", "bill-aging"],
    queryFn: () => reportsApi.getBillAging(),
  });

  const agingBuckets = ["current", "1_30", "31_60", "61_90", "over_90"];
  const bucketLabels: Record<string, string> = {
    current: "Current",
    "1_30": "1-30 Days",
    "31_60": "31-60 Days",
    "61_90": "61-90 Days",
    over_90: "Over 90 Days",
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case "current":
        return "text-green-600 bg-green-50";
      case "1_30":
        return "text-yellow-600 bg-yellow-50";
      case "31_60":
        return "text-orange-600 bg-orange-50";
      case "61_90":
        return "text-red-600 bg-red-50";
      case "over_90":
        return "text-red-800 bg-red-100";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aging Reports</h1>
          <p className="text-muted-foreground">
            Accounts receivable and payable aging analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList>
          <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
          <TabsTrigger value="payables">Accounts Payable</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-6">
          {isLoadingInvoices ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-5">
                {agingBuckets.map((bucket) => (
                  <Card key={bucket}>
                    <CardHeader className="pb-2">
                      <CardDescription>{bucketLabels[bucket]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          invoiceAging?.summary?.[bucket] || "0",
                          currency
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Outstanding Invoices</CardTitle>
                      <CardDescription>
                        Invoices grouped by aging period
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Outstanding</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(invoiceAging?.total || "0", currency)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {invoiceAging?.invoices?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead className="text-right">Balance Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceAging.invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>{invoice.customer_name}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={getBucketColor(invoice.aging_bucket)}
                              >
                                {bucketLabels[invoice.aging_bucket]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(invoice.balance_due, currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4" />
                      <p>No outstanding invoices</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="payables" className="space-y-6">
          {isLoadingBills ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-5">
                {agingBuckets.map((bucket) => (
                  <Card key={bucket}>
                    <CardHeader className="pb-2">
                      <CardDescription>{bucketLabels[bucket]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          billAging?.summary?.[bucket] || "0",
                          currency
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Outstanding Bills</CardTitle>
                      <CardDescription>
                        Bills grouped by aging period
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Outstanding</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(billAging?.total || "0", currency)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {billAging?.bills?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bill #</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead className="text-right">Balance Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billAging.bills.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell className="font-medium">
                              {bill.bill_number}
                            </TableCell>
                            <TableCell>{bill.vendor_name}</TableCell>
                            <TableCell>{formatDate(bill.due_date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={getBucketColor(bill.aging_bucket)}
                              >
                                {bucketLabels[bill.aging_bucket]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(bill.balance_due, currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4" />
                      <p>No outstanding bills</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Aging Analysis Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Monitor 30+ Days</p>
              <p className="text-sm text-muted-foreground">
                Invoices over 30 days should be followed up with customers.
                Consider sending reminders or making phone calls.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Manage Cash Flow</p>
              <p className="text-sm text-muted-foreground">
                Align your bill payments with your receivables. Prioritize paying
                bills that offer early payment discounts.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Review 90+ Days</p>
              <p className="text-sm text-muted-foreground">
                Items over 90 days may need special attention. Consider
                write-offs for uncollectible accounts after exhausting collection
                efforts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
