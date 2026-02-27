"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Landmark,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/lib/hooks/use-reports";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate, parseDecimal } from "@/lib/utils/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardData,
  DashboardRecentInvoice,
  DashboardRecentBill,
  DashboardRecentExpense,
  DashboardRecentJournalEntry,
  DashboardRecentIncome,
} from "@/lib/types";

// Color constants
const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "#9ca3af",
  sent: "#3b82f6",
  viewed: "#8b5cf6",
  partial: "#f59e0b",
  paid: "#22c55e",
  overdue: "#ef4444",
};

const BILL_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  partial: "#eab308",
  paid: "#22c55e",
  void: "#9ca3af",
};

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
    case "posted":
      return "default";
    case "sent":
    case "ask_for_review":
      return "secondary";
    case "overdue":
    case "voided":
      return "destructive";
    default:
      return "outline";
  }
}

function getSourceBadgeVariant(
  source: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (source) {
    case "invoice":
      return "secondary";
    case "bill":
      return "outline";
    case "expense":
      return "destructive";
    case "income":
      return "default";
    default:
      return "outline";
  }
}

function getBankAccountIcon(type: string) {
  switch (type) {
    case "checking":
      return <Landmark className="h-5 w-5 text-blue-500" />;
    case "savings":
      return <PiggyBank className="h-5 w-5 text-green-500" />;
    case "credit_card":
      return <CreditCard className="h-5 w-5 text-purple-500" />;
    case "cash":
      return <Banknote className="h-5 w-5 text-emerald-500" />;
    default:
      return <Wallet className="h-5 w-5 text-gray-500" />;
  }
}

export default function DashboardPage() {
  const { currentBusiness } = useBusiness();
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const currency = currentBusiness?.currency || "USD";

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Row 1 - KPI Summary Cards */}
      <KPIScrollRow>
        <KPICard
          title="Cash Balance"
          value={formatCurrency(dashboard?.cash_balance || "0", currency)}
          icon={<DollarSign className="h-4 w-4 text-blue-500" />}
          colorClass="text-blue-600"
        />
        <KPICard
          title="Accounts Receivable"
          value={formatCurrency(
            dashboard?.accounts_receivable || "0",
            currency
          )}
          icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
          colorClass="text-green-600"
          badge={
            dashboard?.overdue_invoices_count
              ? `${dashboard.overdue_invoices_count} overdue`
              : undefined
          }
        />
        <KPICard
          title="Accounts Payable"
          value={formatCurrency(dashboard?.accounts_payable || "0", currency)}
          icon={<ArrowDownRight className="h-4 w-4 text-orange-500" />}
          colorClass="text-orange-600"
          badge={
            dashboard?.overdue_bills_count
              ? `${dashboard.overdue_bills_count} overdue`
              : undefined
          }
        />
        <KPICard
          title="Revenue This Month"
          value={formatCurrency(
            dashboard?.revenue_this_month || "0",
            currency
          )}
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          colorClass="text-green-600"
        />
        <KPICard
          title="Expenses This Month"
          value={formatCurrency(
            dashboard?.expenses_this_month || "0",
            currency
          )}
          icon={<Receipt className="h-4 w-4 text-red-500" />}
          colorClass="text-red-600"
        />
        <KPICard
          title="Net Income"
          value={formatCurrency(
            dashboard?.net_income_this_month || "0",
            currency
          )}
          icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
          colorClass={
            parseDecimal(dashboard?.net_income_this_month || "0") >= 0
              ? "text-green-600"
              : "text-red-600"
          }
        />
      </KPIScrollRow>

      {/* Row 2 - Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart
          data={dashboard?.revenue_by_month || []}
          currency={currency}
        />
        <ExpensesByCategoryChart
          data={dashboard?.expenses_by_category || []}
          currency={currency}
        />
      </div>

      {/* Row 3 - Status Distributions */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatusDistributionChart
          title="Invoice Status"
          description="Distribution of invoices by status"
          data={dashboard?.invoice_status_distribution || []}
          colorMap={INVOICE_STATUS_COLORS}
          currency={currency}
        />
        <StatusDistributionChart
          title="Bill Status"
          description="Distribution of bills by status"
          data={dashboard?.bill_status_distribution || []}
          colorMap={BILL_STATUS_COLORS}
          currency={currency}
        />
      </div>

      {/* Row 4 - Bank Accounts & Unreconciled */}
      <div className="grid gap-4 md:grid-cols-2">
        <BankAccountsList
          accounts={dashboard?.bank_accounts || []}
          currency={currency}
        />
        <UnreconciledCard
          data={dashboard?.unreconciled_transactions}
          currency={currency}
        />
      </div>

      {/* Row 5 - Recent Activity Tables */}
      <RecentActivityTabs dashboard={dashboard} currency={currency} />
    </div>
  );
}

// ── KPI Scroll Row ───────────────────────────────────────────

function KPIScrollRow({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-md border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-thin"
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-md border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────

function KPICard({
  title,
  value,
  icon,
  colorClass,
  badge,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  badge?: string;
}) {
  return (
    <Card className="min-w-[180px] flex-shrink-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium whitespace-nowrap">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold whitespace-nowrap ${colorClass}`}>{value}</div>
        {badge && (
          <Badge variant="destructive" className="mt-2 text-xs whitespace-nowrap">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// ── Revenue Chart ─────────────────────────────────────────────

function RevenueChart({
  data,
  currency,
}: {
  data: { month: string; month_label: string; amount: string }[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    name: d.month_label,
    amount: parseDecimal(d.amount),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Monthly revenue over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No revenue data available
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    formatCurrency(value, currency).replace(/\.00$/, "")
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value, currency),
                    "Revenue",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="amount"
                  fill="url(#revenueGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Expenses by Category Chart ────────────────────────────────

function ExpensesByCategoryChart({
  data,
  currency,
}: {
  data: { account_code: string; account_name: string; amount: string }[];
  currency: string;
}) {
  const chartData = data.map((d, i) => ({
    name: d.account_name,
    value: parseDecimal(d.amount),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription>Top expense categories this month</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No expense data available
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-[250px] w-[250px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value, currency),
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="font-medium ml-auto whitespace-nowrap">
                    {formatCurrency(item.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Status Distribution Chart ─────────────────────────────────

function StatusDistributionChart({
  title,
  description,
  data,
  colorMap,
  currency,
}: {
  title: string;
  description: string;
  data: { status: string; count: number; total_amount: string }[];
  colorMap: Record<string, string>;
  currency: string;
}) {
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    amount: parseDecimal(d.total_amount),
    color: colorMap[d.status] || "#9ca3af",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No data</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-[180px] w-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const item = chartData.find((d) => d.name === name);
                        return [
                          `${value} (${formatCurrency(item?.amount || 0, currency)})`,
                          name.charAt(0).toUpperCase() + name.slice(1),
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="capitalize text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="font-medium ml-auto">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {totalCount} total {title.toLowerCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Bank Accounts List ────────────────────────────────────────

function BankAccountsList({
  accounts,
  currency,
}: {
  accounts: {
    id: string;
    name: string;
    bank_name: string | null;
    account_type: string;
    current_balance: string;
  }[];
  currency: string;
}) {
  const total = accounts.reduce(
    (sum, a) => sum + parseDecimal(a.current_balance),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Accounts
        </CardTitle>
        <CardDescription>Balances across all accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No bank accounts yet</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/banking/accounts">Add Bank Account</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {getBankAccountIcon(account.account_type)}
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    {account.bank_name && (
                      <p className="text-xs text-muted-foreground">
                        {account.bank_name}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-sm">
                  {formatCurrency(account.current_balance, currency)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="font-medium text-sm">Total</span>
              <span className="font-bold">
                {formatCurrency(total, currency)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Unreconciled Transactions Card ────────────────────────────

function UnreconciledCard({
  data,
  currency,
}: {
  data?: { count: number; total_amount: string };
  currency: string;
}) {
  const count = data?.count || 0;
  const amount = data?.total_amount || "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle
            className={`h-5 w-5 ${count > 0 ? "text-amber-500" : "text-green-500"}`}
          />
          Unreconciled Transactions
        </CardTitle>
        <CardDescription>Transactions needing reconciliation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {count === 0 ? (
            <>
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-green-600">
                All caught up!
              </p>
              <p className="text-sm text-muted-foreground">
                No transactions need reconciliation
              </p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">
                  unreconciled transactions
                </p>
              </div>
              <p className="text-lg font-semibold text-amber-600">
                {formatCurrency(amount, currency)}
              </p>
              <Button asChild className="mt-2">
                <Link href="/banking/reconcile">Reconcile Now</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent Activity Tabs ──────────────────────────────────────

function RecentActivityTabs({
  dashboard,
  currency,
}: {
  dashboard?: DashboardData;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions and entries</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="invoices">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <RecentInvoicesTable
              invoices={dashboard?.recent_invoices || []}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="bills">
            <RecentBillsTable
              bills={dashboard?.recent_bills || []}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <RecentExpensesTable
              expenses={dashboard?.recent_expenses || []}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="income">
            <RecentIncomeTable
              incomes={dashboard?.recent_incomes || []}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="journal">
            <RecentJournalTable
              entries={dashboard?.recent_journal_entries || []}
              currency={currency}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ── Table Components ──────────────────────────────────────────

function RecentInvoicesTable({
  invoices,
  currency,
}: {
  invoices: DashboardRecentInvoice[];
  currency: string;
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No recent invoices
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium">Invoice #</th>
            <th className="py-3 pr-4 font-medium">Customer</th>
            <th className="py-3 pr-4 font-medium">Issue Date</th>
            <th className="py-3 pr-4 font-medium">Due Date</th>
            <th className="py-3 pr-4 font-medium text-right">Total</th>
            <th className="py-3 pr-4 font-medium text-right">Balance Due</th>
            <th className="py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isOverdue =
              inv.status !== "paid" &&
              inv.status !== "voided" &&
              new Date(inv.due_date) < new Date();
            return (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="py-3 pr-4">{inv.customer_name}</td>
                <td className="py-3 pr-4">{formatDate(inv.issue_date)}</td>
                <td
                  className={`py-3 pr-4 ${isOverdue ? "text-red-600 font-medium" : ""}`}
                >
                  {formatDate(inv.due_date)}
                </td>
                <td className="py-3 pr-4 text-right">
                  {formatCurrency(inv.total, currency)}
                </td>
                <td className="py-3 pr-4 text-right font-medium">
                  {parseDecimal(inv.balance_due) > 0
                    ? formatCurrency(inv.balance_due, currency)
                    : "—"}
                </td>
                <td className="py-3">
                  <Badge variant={getStatusBadgeVariant(inv.status)}>
                    {inv.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecentBillsTable({
  bills,
  currency,
}: {
  bills: DashboardRecentBill[];
  currency: string;
}) {
  if (bills.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No recent bills
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium">Bill #</th>
            <th className="py-3 pr-4 font-medium">Vendor</th>
            <th className="py-3 pr-4 font-medium">Bill Date</th>
            <th className="py-3 pr-4 font-medium">Due Date</th>
            <th className="py-3 pr-4 font-medium text-right">Total</th>
            <th className="py-3 pr-4 font-medium text-right">Balance Due</th>
            <th className="py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => {
            const isOverdue =
              bill.status !== "paid" &&
              bill.status !== "voided" &&
              new Date(bill.due_date) < new Date();
            return (
              <tr key={bill.id} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <Link
                    href={`/bills/${bill.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {bill.bill_number}
                  </Link>
                </td>
                <td className="py-3 pr-4">{bill.vendor_name}</td>
                <td className="py-3 pr-4">{formatDate(bill.bill_date)}</td>
                <td
                  className={`py-3 pr-4 ${isOverdue ? "text-red-600 font-medium" : ""}`}
                >
                  {formatDate(bill.due_date)}
                </td>
                <td className="py-3 pr-4 text-right">
                  {formatCurrency(bill.total, currency)}
                </td>
                <td className="py-3 pr-4 text-right font-medium">
                  {parseDecimal(bill.balance_due) > 0
                    ? formatCurrency(bill.balance_due, currency)
                    : "—"}
                </td>
                <td className="py-3">
                  <Badge variant={getStatusBadgeVariant(bill.status)}>
                    {bill.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecentExpensesTable({
  expenses,
  currency,
}: {
  expenses: DashboardRecentExpense[];
  currency: string;
}) {
  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No recent expenses
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium">Description</th>
            <th className="py-3 pr-4 font-medium">Category</th>
            <th className="py-3 pr-4 font-medium">Vendor</th>
            <th className="py-3 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id} className="border-b last:border-0">
              <td className="py-3 pr-4">{formatDate(exp.date)}</td>
              <td className="py-3 pr-4 max-w-[200px] truncate">
                {exp.description || "—"}
              </td>
              <td className="py-3 pr-4">
                <Badge variant="outline">{exp.category_name}</Badge>
              </td>
              <td className="py-3 pr-4">{exp.vendor_name || "—"}</td>
              <td className="py-3 text-right font-medium">
                {formatCurrency(exp.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentIncomeTable({
  incomes,
  currency,
}: {
  incomes: DashboardRecentIncome[];
  currency: string;
}) {
  if (incomes.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No recent income
      </p>
    );
  }

  const incomeTypeColor: Record<string, "default" | "secondary" | "outline"> =
    {
      sales: "default",
      interest: "secondary",
      rental: "outline",
      dividend: "secondary",
    };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium">Description</th>
            <th className="py-3 pr-4 font-medium">Type</th>
            <th className="py-3 pr-4 font-medium">Category</th>
            <th className="py-3 pr-4 font-medium">Contact</th>
            <th className="py-3 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {incomes.map((inc) => (
            <tr key={inc.id} className="border-b last:border-0">
              <td className="py-3 pr-4">{formatDate(inc.date)}</td>
              <td className="py-3 pr-4 max-w-[200px] truncate">
                {inc.description || "—"}
              </td>
              <td className="py-3 pr-4">
                <Badge
                  variant={incomeTypeColor[inc.income_type] || "outline"}
                >
                  {inc.income_type}
                </Badge>
              </td>
              <td className="py-3 pr-4">{inc.category_name}</td>
              <td className="py-3 pr-4">{inc.contact_name || "—"}</td>
              <td className="py-3 text-right font-medium text-green-600">
                {formatCurrency(inc.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentJournalTable({
  entries,
  currency,
}: {
  entries: DashboardRecentJournalEntry[];
  currency: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No recent journal entries
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-3 pr-4 font-medium">Entry #</th>
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium">Description</th>
            <th className="py-3 pr-4 font-medium">Source</th>
            <th className="py-3 pr-4 font-medium text-right">Amount</th>
            <th className="py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b last:border-0">
              <td className="py-3 pr-4">
                <Link
                  href={`/journal-entries/${entry.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {entry.entry_number}
                </Link>
              </td>
              <td className="py-3 pr-4">{formatDate(entry.entry_date)}</td>
              <td className="py-3 pr-4 max-w-[200px] truncate">
                {entry.description || "—"}
              </td>
              <td className="py-3 pr-4">
                <Badge variant={getSourceBadgeVariant(entry.source_type)}>
                  {entry.source_type}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-right font-medium">
                {formatCurrency(entry.total_amount, currency)}
              </td>
              <td className="py-3">
                <Badge variant={getStatusBadgeVariant(entry.status)}>
                  {entry.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="min-w-[180px] flex-shrink-0">
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
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
