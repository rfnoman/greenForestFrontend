"use client";

import Link from "next/link";
import {
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const reports = [
  {
    title: "Profit & Loss",
    description: "Revenue, expenses, and net income over a period",
    href: "/reports/profit-loss",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity at a point in time",
    href: "/reports/balance-sheet",
    icon: BarChart3,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Cash Flow",
    description: "Cash inflows and outflows by category",
    href: "/reports/cash-flow",
    icon: DollarSign,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Aging Reports",
    description: "Accounts receivable and payable aging",
    href: "/reports/aging",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    title: "Trial Balance",
    description: "All account balances with debit and credit totals",
    href: "/reports/trial-balance",
    icon: FileText,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Financial reports and analytics for your business
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Profit & Loss Report</p>
              <p className="text-sm text-muted-foreground">
                Best for understanding your business performance over a period.
                Shows revenue minus expenses to calculate net income.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Balance Sheet</p>
              <p className="text-sm text-muted-foreground">
                Shows what your business owns (assets), owes (liabilities), and
                the owners equity at a specific point in time.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Cash Flow Report</p>
              <p className="text-sm text-muted-foreground">
                Track where your cash is coming from and going to. Essential for
                managing liquidity and planning.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Aging Reports</p>
              <p className="text-sm text-muted-foreground">
                Monitor outstanding invoices and bills by age. Helps with
                collections and cash flow management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
