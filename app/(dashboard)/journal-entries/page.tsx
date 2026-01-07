"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, CheckCircle, Ban, Eye } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journalEntriesApi } from "@/lib/api/journal-entries";
import { JOURNAL_ENTRY_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useBusiness } from "@/lib/hooks/use-business";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import type { JournalEntry, JournalEntryStatus } from "@/lib/types";
import { toast } from "sonner";

export default function JournalEntriesPage() {
  const [selectedStatus, setSelectedStatus] = useState<JournalEntryStatus | "all">("all");
  const { currentBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal-entries", selectedStatus === "all" ? {} : { status: selectedStatus }],
    queryFn: () => journalEntriesApi.list(selectedStatus === "all" ? undefined : { status: selectedStatus }),
  });
  const postEntry = useMutation({
    mutationFn: (id: string) => journalEntriesApi.post(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });
  const voidEntry = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => journalEntriesApi.void(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });
  const [voidingEntry, setVoidingEntry] = useState<JournalEntry | null>(null);
  const currency = currentBusiness?.currency || "USD";

  const handlePost = async (entry: JournalEntry) => {
    try {
      await postEntry.mutateAsync(entry.id);
      toast.success("Journal entry posted");
    } catch {
      toast.error("Failed to post entry");
    }
  };

  const handleVoid = async () => {
    if (!voidingEntry) return;
    try {
      await voidEntry.mutateAsync({ id: voidingEntry.id, reason: "Voided by user" });
      toast.success("Journal entry voided");
      setVoidingEntry(null);
    } catch {
      toast.error("Failed to void entry");
    }
  };

  const getStatusBadge = (status: JournalEntryStatus) => {
    let variant: "default" | "success" | "secondary" = "default";
    switch (status) {
      case "posted": variant = "success"; break;
      case "draft":
      case "voided": variant = "secondary"; break;
    }
    const statusConfig = JOURNAL_ENTRY_STATUSES.find((s) => s.value === status);
    return <Badge variant={variant}>{statusConfig?.label || status}</Badge>;
  };

  const columns: ColumnDef<JournalEntry>[] = [
    {
      accessorKey: "entry_number",
      header: "Entry #",
      cell: ({ row }) => (
        <Link href={`/journal-entries/${row.original.id}`} className="font-medium hover:underline">
          {row.original.entry_number}
        </Link>
      ),
    },
    { accessorKey: "entry_date", header: "Date", cell: ({ row }) => formatDate(row.original.entry_date) },
    { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description || "-" },
    {
      id: "total",
      header: "Amount",
      cell: ({ row }) => {
        const total = row.original.lines.reduce((sum, line) => sum + parseFloat(line.debit || "0"), 0);
        return formatCurrency(total, currency);
      },
    },
    { accessorKey: "source_type", header: "Source", cell: ({ row }) => <span className="capitalize">{row.original.source_type}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => getStatusBadge(row.original.status) },
    {
      id: "actions",
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href={`/journal-entries/${entry.id}`}><Eye className="h-4 w-4 mr-2" />View</Link></DropdownMenuItem>
              {entry.status === "draft" && (
                <DropdownMenuItem onClick={() => handlePost(entry)}><CheckCircle className="h-4 w-4 mr-2" />Post</DropdownMenuItem>
              )}
              {entry.status === "posted" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setVoidingEntry(entry)}>
                    <Ban className="h-4 w-4 mr-2" />Void
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
            <p className="text-muted-foreground">Manage accounting entries</p>
          </div>
        </div>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground">Manage accounting entries</p>
        </div>
        <Button asChild><Link href="/journal-entries/new"><Plus className="mr-2 h-4 w-4" />New Entry</Link></Button>
      </div>

      <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as JournalEntryStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {JOURNAL_ENTRY_STATUSES.map((status) => <TabsTrigger key={status.value} value={status.value}>{status.label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={selectedStatus} className="mt-4">
          <DataTable columns={columns} data={entries || []} searchKey="description" searchPlaceholder="Search entries..." />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!voidingEntry} onOpenChange={() => setVoidingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void entry #{voidingEntry?.entry_number}? This will reverse all accounting effects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoid} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Void Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
