"use client";

import { useMemo } from "react";
import {
  Users,
  UserCheck,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  FileEdit,
  FileSearch,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAccountantAuth } from "@/lib/hooks/use-accountant-auth";
import { useSupervisorDashboard } from "@/lib/hooks/use-supervisor-dashboard";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

const USER_TYPE_LABELS: Record<string, string> = {
  owner: "Owners",
  manager: "Managers",
  accountant: "Accountants",
  accountant_supervisor: "Supervisors",
};

export default function SupervisorOverviewPage() {
  const { user } = useAccountantAuth();
  const { data: dashboard, isLoading } = useSupervisorDashboard();

  const pieData = useMemo(() => {
    if (!dashboard?.user_type_distribution) return [];
    return dashboard.user_type_distribution.map((d) => ({
      name: USER_TYPE_LABELS[d.user_type] || d.user_type,
      value: d.count,
    }));
  }, [dashboard?.user_type_distribution]);

  const registrationData = useMemo(() => {
    if (!dashboard?.monthly_registrations) return [];
    return dashboard.monthly_registrations.map((m) => ({
      month: m.month_label,
      users: m.user_count,
      businesses: m.business_count,
    }));
  }, [dashboard?.monthly_registrations]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Supervisor Overview
        </h1>
        <p className="text-muted-foreground">
          System-wide dashboard for {user?.first_name || user?.username || "Supervisor"}
          {dashboard?.as_of_date && ` — as of ${formatDate(dashboard.as_of_date)}`}
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        <StatCard
          title="Total Users"
          value={dashboard?.total_users ?? 0}
          icon={<Users className="h-4 w-4 text-blue-500" />}
        />
        <StatCard
          title="Active Users"
          value={dashboard?.active_users ?? 0}
          icon={<UserCheck className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          title="Total Businesses"
          value={dashboard?.total_businesses ?? 0}
          icon={<Building2 className="h-4 w-4 text-indigo-500" />}
        />
        <StatCard
          title="Active Businesses"
          value={dashboard?.active_businesses ?? 0}
          icon={<Building2 className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          title="Total Entries"
          value={dashboard?.total_journal_entries ?? 0}
          icon={<FileSpreadsheet className="h-4 w-4 text-slate-500" />}
        />
        <StatCard
          title="Posted"
          value={dashboard?.total_posted_entries ?? 0}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          title="Draft"
          value={dashboard?.total_draft_entries ?? 0}
          icon={<FileEdit className="h-4 w-4 text-yellow-500" />}
        />
        <StatCard
          title="Review Requested"
          value={dashboard?.total_review_requested_entries ?? 0}
          icon={<FileSearch className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title="Void"
          value={dashboard?.total_void_entries ?? 0}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
        />
      </div>

      {/* User Distribution Chart + Financial Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Distribution Donut */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by user type</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No user data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Financial Overview Cards */}
        <div className="grid gap-4 grid-rows-2 grid-cols-2">
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total AR System-wide</CardTitle>
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(dashboard?.total_ar_system || "0")}
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total AP System-wide</CardTitle>
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {formatCurrency(dashboard?.total_ap_system || "0")}
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {dashboard?.total_overdue_invoices ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {dashboard?.total_overdue_bills ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registration Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Registration Trends</CardTitle>
              <CardDescription>New users and businesses per month (last 6 months)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {registrationData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
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
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="users"
                    name="New Users"
                    fill="hsl(221.2 83.2% 53.3%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="businesses"
                    name="New Businesses"
                    fill="hsl(142.1 76.2% 36.3%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              No registration data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Accountant Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accountant Performance</CardTitle>
          <CardDescription>Monthly workload summary for each accountant</CardDescription>
        </CardHeader>
        <CardContent>
          {!dashboard?.accountant_performance?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No accountant performance data available
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Entries Posted</TableHead>
                    <TableHead className="text-right">Entries Reviewed</TableHead>
                    <TableHead className="text-right">Impersonations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.accountant_performance.map((acct) => (
                    <TableRow key={acct.accountant_id}>
                      <TableCell className="font-medium">
                        {acct.accountant_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {acct.accountant_email}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {acct.entries_posted_this_month}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {acct.entries_reviewed_this_month}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {acct.impersonations_this_month}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Impersonation Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Impersonation Log</CardTitle>
          <CardDescription>Audit trail of accountant impersonation sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {!dashboard?.recent_impersonations?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No impersonation records
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accountant</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Ended At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recent_impersonations.map((imp, i) => (
                    <TableRow key={`${imp.accountant_email}-${imp.started_at}-${i}`}>
                      <TableCell className="font-medium">
                        {imp.accountant_email}
                      </TableCell>
                      <TableCell>{imp.target_email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {imp.reason || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDateTime(imp.started_at)}
                      </TableCell>
                      <TableCell>
                        {imp.ended_at ? (
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatDateTime(imp.ended_at)}
                          </span>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────

function StatCard({
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
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
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
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 grid-rows-2 grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
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
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
