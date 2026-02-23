"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Users,
  Clock,
  FileSearch,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  Eye,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccountantAuth } from "@/lib/hooks/use-accountant-auth";
import { useAccountantDashboard } from "@/lib/hooks/use-accountant-dashboard";
import { formatCurrency, formatDate, parseDecimal } from "@/lib/utils/format";
import type {
  AccountantDashboardBusinessOverview,
  AccountantDashboardJournalEntry,
} from "@/lib/types";

type SortField =
  | "name"
  | "owner_name"
  | "total_ar"
  | "total_ap"
  | "cash_balance"
  | "revenue_this_month"
  | "expenses_this_month"
  | "net_income_this_month"
  | "overdue_invoices_count"
  | "overdue_bills_count"
  | "pending_journal_entries"
  | "review_requested_entries";

const JE_STATUS_CONFIG: Record<string, { color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { color: "bg-gray-500", variant: "secondary" },
  ask_for_review: { color: "bg-orange-500", variant: "outline" },
  posted: { color: "bg-green-500", variant: "default" },
  voided: { color: "bg-red-500", variant: "destructive" },
};

export default function AccountantDashboardPage() {
  const { user, handleImpersonate } = useAccountantAuth();
  const { data: dashboard, isLoading } = useAccountantDashboard();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredAndSorted = useMemo(() => {
    if (!dashboard?.business_overviews) return [];

    let filtered = dashboard.business_overviews;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.owner_name.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      const field = sortField;
      let aVal: string | number = a[field];
      let bVal: string | number = b[field];

      if (typeof aVal === "string" && !isNaN(parseFloat(aVal)) && field !== "name" && field !== "owner_name") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal as string);
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [dashboard?.business_overviews, searchQuery, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.first_name || user?.username || "User"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your accountant dashboard overview
          {dashboard?.as_of_date && ` as of ${formatDate(dashboard.as_of_date)}`}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard
          title="Total Businesses"
          value={dashboard?.total_businesses ?? 0}
          icon={<Building2 className="h-4 w-4 text-blue-500" />}
        />
        <SummaryCard
          title="Active Businesses"
          value={dashboard?.active_businesses ?? 0}
          icon={<Building2 className="h-4 w-4 text-green-500" />}
        />
        <SummaryCard
          title="Total Owners"
          value={dashboard?.total_owners ?? 0}
          icon={<Users className="h-4 w-4 text-indigo-500" />}
        />
        <SummaryCard
          title="Pending Entries"
          value={dashboard?.total_pending_entries ?? 0}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
        />
        <SummaryCard
          title="Review Requested"
          value={dashboard?.total_review_requested_entries ?? 0}
          icon={<FileSearch className="h-4 w-4 text-orange-500" />}
        />
        <SummaryCard
          title="Overdue Invoices"
          value={dashboard?.total_overdue_invoices ?? 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        />
        <SummaryCard
          title="Overdue Bills"
          value={dashboard?.total_overdue_bills ?? 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        />
      </div>

      {/* Aggregate Financial Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts Receivable</CardTitle>
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(dashboard?.total_ar_all_businesses || "0")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all businesses</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts Payable</CardTitle>
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(dashboard?.total_ap_all_businesses || "0")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all businesses</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Overview Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Overview</CardTitle>
              <CardDescription>Financial summary for each client business</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No businesses found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "No business data available"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="name" label="Business" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="owner_name" label="Owner" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <TableHead>Currency</TableHead>
                    <SortableHeader field="total_ar" label="AR" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="total_ap" label="AP" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="cash_balance" label="Cash" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="revenue_this_month" label="Revenue" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="expenses_this_month" label="Expenses" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="net_income_this_month" label="Net Income" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="overdue_invoices_count" label="Overdue Inv." current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="overdue_bills_count" label="Overdue Bills" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="pending_journal_entries" label="Pending JEs" current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <SortableHeader field="review_requested_entries" label="Review Req." current={sortField} direction={sortDirection} onToggle={toggleSort} />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.map((biz) => (
                    <BusinessRow key={biz.id} biz={biz} onView={handleImpersonate} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest journal entries across all businesses</CardDescription>
        </CardHeader>
        <CardContent>
          {!dashboard?.recent_journal_entries?.length ? (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recent_journal_entries.map((entry, i) => (
                <ActivityRow key={`${entry.entry_number}-${i}`} entry={entry} onNavigate={handleImpersonate} businessOverviews={dashboard.business_overviews} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// ── Sortable Header ───────────────────────────────────────────

function SortableHeader({
  field,
  label,
  current,
  direction,
  onToggle,
}: {
  field: SortField;
  label: string;
  current: SortField;
  direction: "asc" | "desc";
  onToggle: (field: SortField) => void;
}) {
  return (
    <TableHead>
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onToggle(field)}>
        {label}
        <ArrowUpDown className={`ml-1 h-3 w-3 ${current === field ? "opacity-100" : "opacity-40"}`} />
        {current === field && (
          <span className="ml-0.5 text-xs">{direction === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </Button>
    </TableHead>
  );
}

// ── Business Row ──────────────────────────────────────────────

function BusinessRow({
  biz,
  onView,
}: {
  biz: AccountantDashboardBusinessOverview;
  onView: (ownerEmail: string) => Promise<void>;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {biz.name}
          {!biz.is_active && (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{biz.owner_name}</TableCell>
      <TableCell>
        <Badge variant="outline">{biz.currency}</Badge>
      </TableCell>
      <TableCell className="text-green-600 font-medium">
        {formatCurrency(biz.total_ar, biz.currency)}
      </TableCell>
      <TableCell className="text-red-600 font-medium">
        {formatCurrency(biz.total_ap, biz.currency)}
      </TableCell>
      <TableCell className="font-medium">
        {formatCurrency(biz.cash_balance, biz.currency)}
      </TableCell>
      <TableCell>{formatCurrency(biz.revenue_this_month, biz.currency)}</TableCell>
      <TableCell>{formatCurrency(biz.expenses_this_month, biz.currency)}</TableCell>
      <TableCell className={parseDecimal(biz.net_income_this_month) >= 0 ? "text-green-600" : "text-red-600"}>
        {formatCurrency(biz.net_income_this_month, biz.currency)}
      </TableCell>
      <TableCell>
        {biz.overdue_invoices_count > 0 ? (
          <Badge variant="destructive">{biz.overdue_invoices_count}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>
      <TableCell>
        {biz.overdue_bills_count > 0 ? (
          <Badge variant="destructive">{biz.overdue_bills_count}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>
      <TableCell>
        {biz.pending_journal_entries > 0 ? (
          <Badge variant="secondary">{biz.pending_journal_entries}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>
      <TableCell>
        {biz.review_requested_entries > 0 ? (
          <Badge variant="outline" className="border-orange-300 text-orange-600">{biz.review_requested_entries}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => onView(biz.owner_email)}>
          <Eye className="mr-1 h-3 w-3" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ── Activity Row ──────────────────────────────────────────────

function ActivityRow({
  entry,
  onNavigate,
  businessOverviews,
}: {
  entry: AccountantDashboardJournalEntry;
  onNavigate: (ownerEmail: string) => Promise<void>;
  businessOverviews: AccountantDashboardBusinessOverview[];
}) {
  const statusConfig = JE_STATUS_CONFIG[entry.status] || JE_STATUS_CONFIG.draft;
  const business = businessOverviews.find((b) => b.id === entry.business_id);

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => business && onNavigate(business.owner_email)}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {entry.business_name}
          </Badge>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{entry.entry_number}</span>
            <Badge variant={statusConfig.variant} className="text-xs">
              {entry.status === "ask_for_review" ? "Review Requested" : entry.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {entry.description || "No description"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <span className="text-sm font-medium">{formatCurrency(entry.total_amount)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(entry.entry_date)}</span>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
