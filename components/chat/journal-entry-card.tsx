"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { FileText, User } from "lucide-react";
import type { JournalEntrySummaryData } from "@/lib/hooks/use-chat";

interface JournalEntryCardProps {
  data: JournalEntrySummaryData;
}

export const JournalEntryCard = memo(function JournalEntryCard({
  data,
}: JournalEntryCardProps) {
  const totalDebits = data.lines.reduce(
    (sum, line) => sum + parseFloat(line.debit || "0"),
    0
  );
  const totalCredits = data.lines.reduce(
    (sum, line) => sum + parseFloat(line.credit || "0"),
    0
  );

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden max-w-md">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{data.entry_number}</span>
        </div>
        <Badge
          variant={
            data.status === "posted"
              ? "default"
              : data.status === "voided"
              ? "destructive"
              : "secondary"
          }
          className="text-xs capitalize"
        >
          {data.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Meta info */}
      <div className="px-4 py-2 text-xs text-muted-foreground space-y-1">
        <div>Date: {data.entry_date}</div>
        {data.description && <div>{data.description}</div>}
        {data.contact && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {data.contact.name} ({data.contact.type})
          </div>
        )}
      </div>

      {/* Lines table */}
      <div className="px-2 pb-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Account</TableHead>
              <TableHead className="text-xs h-8 text-right">Debit</TableHead>
              <TableHead className="text-xs h-8 text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lines.map((line, idx) => (
              <TableRow key={idx}>
                <TableCell className="py-1.5 text-xs">
                  {line.account_code} – {line.account_name}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-right font-mono">
                  {parseFloat(line.debit) > 0
                    ? parseFloat(line.debit).toFixed(2)
                    : "–"}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-right font-mono">
                  {parseFloat(line.credit) > 0
                    ? parseFloat(line.credit).toFixed(2)
                    : "–"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="py-1.5 text-xs font-bold">Total</TableCell>
              <TableCell className="py-1.5 text-xs text-right font-bold font-mono">
                {totalDebits.toFixed(2)}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-right font-bold font-mono">
                {totalCredits.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
});
