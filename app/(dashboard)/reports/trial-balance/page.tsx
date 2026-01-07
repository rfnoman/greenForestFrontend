"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Printer, CheckCircle, AlertTriangle } from "lucide-react";
import { reportsApi } from "@/lib/api/reports";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TrialBalancePage() {
  const { currentBusiness } = useBusiness();
  const currency = currentBusiness?.currency || "USD";

  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "trial-balance", asOfDate],
    queryFn: () => reportsApi.getTrialBalance(),
  });

  const totalDebits = parseFloat(report?.total_debits || "0");
  const totalCredits = parseFloat(report?.total_credits || "0");
  const isBalanced = report?.is_balanced ?? Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
          <p className="text-muted-foreground">
            Summary of all account balances with debit and credit totals
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

      <Card>
        <CardHeader>
          <CardTitle>Report Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label>As of Date</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Debits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalDebits.toString(), currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Credits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalCredits.toString(), currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Balance Status</CardDescription>
              </CardHeader>
              <CardContent>
                {isBalanced ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      Balanced
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <span className="text-lg font-semibold text-red-600">
                      Unbalanced ({formatCurrency(report?.difference || "0", currency)})
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trial Balance Report</CardTitle>
              <CardDescription>
                As of {format(new Date(asOfDate), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report?.accounts?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.accounts.map((account) => {
                      const debit = parseFloat(account.debit || "0");
                      const credit = parseFloat(account.credit || "0");
                      if (debit === 0 && credit === 0) return null;

                      return (
                        <TableRow key={account.account_id}>
                          <TableCell className="font-mono">
                            {account.account_code}
                          </TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {account.account_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {debit > 0 ? formatCurrency(account.debit, currency) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {credit > 0 ? formatCurrency(account.credit, currency) : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalDebits.toString(), currency)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalCredits.toString(), currency)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No account balances found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {!isBalanced && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Trial Balance Out of Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-red-700">
                <p>
                  Your trial balance is out of balance by{" "}
                  <strong>{formatCurrency(report?.difference || "0", currency)}</strong>.
                  This could indicate:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Journal entries that dont balance</li>
                  <li>System errors in transaction recording</li>
                  <li>Missing or duplicate entries</li>
                </ul>
                <p className="mt-4">
                  Review your recent journal entries to identify and correct the
                  discrepancy.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
