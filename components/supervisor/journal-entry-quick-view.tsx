"use client";

import { formatDate, formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";
import type { JournalEntryWithBusiness } from "@/lib/types";
import { useRouter } from "next/navigation";

interface JournalEntryQuickViewProps {
  entry: JournalEntryWithBusiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPost: () => void;
}

export function JournalEntryQuickView({
  entry,
  open,
  onOpenChange,
  onPost,
}: JournalEntryQuickViewProps) {
  const router = useRouter();

  // Calculate totals
  const totalDebit = entry.lines.reduce(
    (sum, line) => sum + parseFloat(line.debit || "0"),
    0
  );
  const totalCredit = entry.lines.reduce(
    (sum, line) => sum + parseFloat(line.credit || "0"),
    0
  );

  const handleEdit = () => {
    // Navigate to the journal entry detail page
    // Note: This will require impersonating the owner first
    router.push(`/journal-entries/${entry.id}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Journal Entry: {entry.entry_number}
            <Badge variant="outline">Draft</Badge>
          </SheetTitle>
          <SheetDescription>
            Review the details of this journal entry
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Entry Information */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Entry Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <div className="font-medium">{formatDate(entry.entry_date)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Entry Number:</span>
                <div className="font-medium">{entry.entry_number}</div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <div className="font-medium">{entry.description || "—"}</div>
              </div>
            </div>
          </div>

          {/* Business & Owner Information */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Business Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Business:</span>
                <div className="font-medium">{entry.business_name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Owner:</span>
                <div className="font-medium">{entry.owner_name}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.owner_email}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Line Items</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{line.account_name}</div>
                          <div className="text-muted-foreground">
                            {line.account_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {line.description || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {line.debit && parseFloat(line.debit) > 0
                          ? formatCurrency(parseFloat(line.debit), "USD")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {line.credit && parseFloat(line.credit) > 0
                          ? formatCurrency(parseFloat(line.credit), "USD")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(totalDebit, "USD")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(totalCredit, "USD")}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          {/* Contact Information (if available) */}
          {entry.contact && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Contact</h4>
              <div className="text-sm">
                <div className="font-medium">{entry.contact.name}</div>
                <Badge variant="secondary" className="mt-1">
                  {entry.contact.type}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="secondary" onClick={handleEdit}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
          <Button onClick={onPost}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Post Entry
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
