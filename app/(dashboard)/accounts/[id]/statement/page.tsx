"use client";

import { use, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAccountStatement } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AccountStatementLine } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 50;

function getDefaultDates() {
  const now = new Date();
  return {
    from: format(startOfMonth(now), "yyyy-MM-dd"),
    to: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  invoice: "Invoice",
  bill: "Bill",
  expense: "Expense",
};

export default function AccountStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentBusiness } = useBusiness();
  const currency = currentBusiness?.currency || "USD";

  const defaults = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [appliedFrom, setAppliedFrom] = useState(defaults.from);
  const [appliedTo, setAppliedTo] = useState(defaults.to);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAccountStatement(id, {
    from_date: appliedFrom,
    to_date: appliedTo,
    page,
    page_size: PAGE_SIZE,
  });

  const handleApply = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApply();
  };

  if (isError) {
    const status = (error as { status?: number })?.status;
    const message =
      status === 400
        ? "Invalid date range. Please check your from and to dates."
        : status === 404
          ? "Account not found."
          : "Failed to load account statement. Please try again.";

    return (
      <div className="space-y-6">
        <BackHeader id={id} />
        <DateRangeBar
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onApply={handleApply}
          onKeyDown={handleKeyDown}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackHeader id={id} name={data?.account_name} />

      <DateRangeBar
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onApply={handleApply}
        onKeyDown={handleKeyDown}
        isLoading={isLoading}
      />

      {isLoading ? (
        <StatementSkeleton />
      ) : data ? (
        <>
          {/* Account Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {data.account_code} - {data.account_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(data.from_date)} to {formatDate(data.to_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {data.account_type}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {data.normal_balance}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Transaction Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[100px]">Entry #</TableHead>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Debit
                    </TableHead>
                    <TableHead className="text-right w-[120px]">
                      Credit
                    </TableHead>
                    <TableHead className="text-right w-[130px]">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={5}>Opening Balance</TableCell>
                    <TableCell className="text-right" />
                    <TableCell className="text-right" />
                    <TableCell className="text-right">
                      {formatCurrency(data.opening_balance, currency)}
                    </TableCell>
                  </TableRow>

                  {/* Transaction Rows */}
                  {data.lines.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No transactions found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.lines.map(
                      (line: AccountStatementLine, idx: number) => (
                        <TableRow key={`${line.journal_entry_id}-${idx}`}>
                          <TableCell className="text-sm">
                            {formatDate(line.entry_date)}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/journal-entries/${line.journal_entry_id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {line.entry_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {SOURCE_TYPE_LABELS[line.source_type] ||
                                line.source_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {line.description || line.line_description || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {line.contact_name || "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {parseFloat(line.debit) > 0
                              ? formatCurrency(line.debit, currency)
                              : ""}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {parseFloat(line.credit) > 0
                              ? formatCurrency(line.credit, currency)
                              : ""}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(line.running_balance, currency)}
                          </TableCell>
                        </TableRow>
                      )
                    )
                  )}

                  {/* Closing Balance Row */}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell colSpan={5}>Closing Balance</TableCell>
                    <TableCell className="text-right" />
                    <TableCell className="text-right" />
                    <TableCell className="text-right">
                      {formatCurrency(data.closing_balance, currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Bar */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(data.summary.total_debits, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(data.summary.total_credits, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Net Change</p>
                <p
                  className={cn(
                    "text-xl font-semibold mt-1",
                    parseFloat(data.summary.net_change) > 0
                      ? "text-green-600"
                      : parseFloat(data.summary.net_change) < 0
                        ? "text-red-600"
                        : ""
                  )}
                >
                  {formatCurrency(data.summary.net_change, currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(data.total_pages, p + 1))
                }
                disabled={page >= data.total_pages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function BackHeader({ id, name }: { id: string; name?: string }) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/accounts/${id}`}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Account Statement
        </h1>
        {name && <p className="text-muted-foreground">{name}</p>}
      </div>
    </div>
  );
}

function DateRangeBar({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onApply,
  onKeyDown,
  isLoading,
}: {
  fromDate: string;
  toDate: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onApply: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          From
        </label>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-auto"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">To</label>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-auto"
        />
      </div>
      <Button onClick={onApply} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Apply
      </Button>
    </div>
  );
}

function StatementSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40 mt-1" />
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
