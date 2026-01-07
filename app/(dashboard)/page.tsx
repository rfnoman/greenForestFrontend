"use client";

import { ArrowDownRight, ArrowUpRight, DollarSign, FileText, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/lib/hooks/use-reports";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";

export default function DashboardPage() {
  const { currentBusiness } = useBusiness();
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const currency = currentBusiness?.currency || "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/invoices/new">
              <FileText className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/expenses/new">
              <Receipt className="mr-2 h-4 w-4" />
              Record Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard?.total_revenue || "0", currency)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard?.total_expenses || "0", currency)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard?.net_income || "0", currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue - Expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard?.cash_balance || "0", currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receivables & Payables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accounts Receivable</CardTitle>
            <CardDescription>Outstanding customer invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(dashboard?.accounts_receivable || "0", currency)}
            </div>
            {(dashboard?.overdue_invoices_count || 0) > 0 && (
              <Badge variant="destructive" className="mt-2">
                {dashboard?.overdue_invoices_count} overdue
              </Badge>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">View Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accounts Payable</CardTitle>
            <CardDescription>Outstanding bills to pay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(dashboard?.accounts_payable || "0", currency)}
            </div>
            {(dashboard?.overdue_bills_count || 0) > 0 && (
              <Badge variant="destructive" className="mt-2">
                {dashboard?.overdue_bills_count} overdue
              </Badge>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/bills">View Bills</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Last 6 months overview</CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowChart />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest banking activity</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.recent_transactions && dashboard.recent_transactions.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recent_transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.description || "Transaction"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div
                    className={`font-medium ${
                      parseFloat(transaction.amount) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(transaction.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No recent transactions
            </p>
          )}
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/banking/transactions">View All Transactions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
