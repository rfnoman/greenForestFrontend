"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Download, Printer, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

export default function ProfitLossPage() {
  const { currentBusiness } = useBusiness();
  const currency = currentBusiness?.currency || "USD";

  const [startDate, setStartDate] = useState(
    format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "profit-loss", startDate, endDate],
    queryFn: () => reportsApi.getProfitLoss({ start_date: startDate, end_date: endDate }),
  });

  const totalRevenue = parseFloat(report?.revenue?.total || "0");
  const totalExpenses = parseFloat(report?.expenses?.total || "0");
  const netIncome = parseFloat(report?.net_income || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
          <p className="text-muted-foreground">
            Income statement for the selected period
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
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
                <CardDescription>Total Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalExpenses.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {netIncome > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : netIncome < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : (
                    <Minus className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      netIncome > 0
                        ? "text-green-600"
                        : netIncome < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {formatCurrency(netIncome.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                {format(new Date(startDate), "MMMM d, yyyy")} -{" "}
                {format(new Date(endDate), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-green-700">Revenue</h3>
                {report?.revenue?.accounts?.length ? (
                  <div className="space-y-2">
                    {report.revenue.accounts.map((account) => (
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
                      <span>Total Revenue</span>
                      <span className="text-green-600">
                        {formatCurrency(report.revenue.total, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No revenue recorded for this period
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 text-red-700">Expenses</h3>
                {report?.expenses?.accounts?.length ? (
                  <div className="space-y-2">
                    {report.expenses.accounts.map((account) => (
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
                      <span>Total Expenses</span>
                      <span className="text-red-600">
                        {formatCurrency(report.expenses.total, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No expenses recorded for this period
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between py-4 px-4 bg-muted rounded-lg">
                <span className="text-lg font-bold">Net Income</span>
                <span
                  className={`text-xl font-bold ${
                    netIncome > 0
                      ? "text-green-600"
                      : netIncome < 0
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {formatCurrency(report?.net_income || "0", currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
