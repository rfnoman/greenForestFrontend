"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Printer, Building2, CreditCard, Wallet } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

export default function BalanceSheetPage() {
  const { currentBusiness } = useBusiness();
  const currency = currentBusiness?.currency || "USD";

  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "balance-sheet", asOfDate],
    queryFn: () => reportsApi.getBalanceSheet({ as_of_date: asOfDate }),
  });

  const totalAssets = parseFloat(report?.assets?.total || "0");
  const totalLiabilities = parseFloat(report?.liabilities?.total || "0");
  const totalEquity = parseFloat(report?.equity?.total || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
          <p className="text-muted-foreground">
            Financial position as of a specific date
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
                <CardDescription>Total Assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAssets.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Liabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalLiabilities.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Equity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalEquity.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                As of {format(new Date(asOfDate), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-blue-700">Assets</h3>
                {report?.assets?.accounts?.length ? (
                  <div className="space-y-2">
                    {report.assets.accounts.map((account) => (
                      <div
                        key={account.account_id}
                        className="flex items-center justify-between py-2 px-4 rounded-md hover:bg-muted/50"
                      >
                        <div>
                          <span className="text-sm text-muted-foreground mr-2">
                            {account.account_code}
                          </span>
                          <span>{account.account_name}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(account.balance, currency)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between py-2 px-4 font-semibold">
                      <span>Total Assets</span>
                      <span className="text-blue-600">
                        {formatCurrency(report.assets.total, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No asset accounts found
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 text-red-700">Liabilities</h3>
                {report?.liabilities?.accounts?.length ? (
                  <div className="space-y-2">
                    {report.liabilities.accounts.map((account) => (
                      <div
                        key={account.account_id}
                        className="flex items-center justify-between py-2 px-4 rounded-md hover:bg-muted/50"
                      >
                        <div>
                          <span className="text-sm text-muted-foreground mr-2">
                            {account.account_code}
                          </span>
                          <span>{account.account_name}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(account.balance, currency)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between py-2 px-4 font-semibold">
                      <span>Total Liabilities</span>
                      <span className="text-red-600">
                        {formatCurrency(report.liabilities.total, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No liability accounts found
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 text-green-700">Equity</h3>
                {report?.equity?.accounts?.length ? (
                  <div className="space-y-2">
                    {report.equity.accounts.map((account) => (
                      <div
                        key={account.account_id}
                        className="flex items-center justify-between py-2 px-4 rounded-md hover:bg-muted/50"
                      >
                        <div>
                          <span className="text-sm text-muted-foreground mr-2">
                            {account.account_code}
                          </span>
                          <span>{account.account_name}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(account.balance, currency)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between py-2 px-4 font-semibold">
                      <span>Total Equity</span>
                      <span className="text-green-600">
                        {formatCurrency(report.equity.total, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No equity accounts found
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-4 bg-muted rounded-lg">
                  <span className="font-semibold">Total Liabilities + Equity</span>
                  <span className="font-bold">
                    {formatCurrency(
                      (totalLiabilities + totalEquity).toString(),
                      currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-4">
                  <span className="text-sm text-muted-foreground">
                    Difference (should be zero)
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      (totalAssets - totalLiabilities - totalEquity).toString(),
                      currency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
