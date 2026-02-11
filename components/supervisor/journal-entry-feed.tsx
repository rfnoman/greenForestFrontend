"use client";

import { useState } from "react";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, CheckCircle2, Loader2, FileText } from "lucide-react";
import { useSupervisorJournalFeed } from "@/lib/hooks/use-supervisor-journal-feed";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntryWithBusiness } from "@/lib/types";
import { JournalEntryQuickView } from "./journal-entry-quick-view";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supervisorApi } from "@/lib/api/supervisor";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function JournalEntryFeed() {
  const { data: entries, isLoading, dataUpdatedAt, refetch } = useSupervisorJournalFeed();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryWithBusiness | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [entryToPost, setEntryToPost] = useState<JournalEntryWithBusiness | null>(null);

  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: ({ entryId, businessId }: { entryId: string; businessId: string }) =>
      supervisorApi.postJournalEntry(entryId, businessId),
    onSuccess: () => {
      toast.success("Journal entry posted successfully");
      queryClient.invalidateQueries({ queryKey: ["supervisor-journal-feed"] });
      setPostDialogOpen(false);
      setEntryToPost(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to post journal entry");
    },
  });

  const handleView = (entry: JournalEntryWithBusiness) => {
    setSelectedEntry(entry);
    setQuickViewOpen(true);
  };

  const handlePostClick = (entry: JournalEntryWithBusiness) => {
    setEntryToPost(entry);
    setPostDialogOpen(true);
  };

  const handlePostConfirm = () => {
    if (entryToPost) {
      postMutation.mutate({
        entryId: entryToPost.id,
        businessId: entryToPost.business_id,
      });
    }
  };

  // Calculate total for an entry
  const calculateTotal = (entry: JournalEntryWithBusiness) => {
    return entry.lines.reduce((sum, line) => {
      const debit = parseFloat(line.debit || "0");
      return sum + debit;
    }, 0);
  };

  // Filter entries based on search term
  const filteredEntries = entries?.filter((entry) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.entry_number.toLowerCase().includes(searchLower) ||
      entry.business_name.toLowerCase().includes(searchLower) ||
      entry.owner_name.toLowerCase().includes(searchLower) ||
      (entry.description || "").toLowerCase().includes(searchLower)
    );
  });

  const lastUpdateTime = dataUpdatedAt ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true }) : "Never";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Draft Journal Entries</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are no draft journal entries across all businesses
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search by entry number, business, owner, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Badge variant="outline" className="whitespace-nowrap">
            Updated {lastUpdateTime}
          </Badge>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries && filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                    <TableCell>{formatDate(entry.entry_date)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.business_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{entry.owner_name}</div>
                        <div className="text-muted-foreground">{entry.owner_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateTotal(entry), "USD")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handlePostClick(entry)}
                          disabled={postMutation.isPending}
                        >
                          {postMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Post
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No entries found matching your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredEntries?.length || 0} of {entries.length} draft entries
        </div>
      </div>

      {selectedEntry && (
        <JournalEntryQuickView
          entry={selectedEntry}
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          onPost={() => {
            setQuickViewOpen(false);
            handlePostClick(selectedEntry);
          }}
        />
      )}

      <AlertDialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post Journal Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to post this journal entry? This action cannot be undone and the
              entry will be marked as posted.
              {entryToPost && (
                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Entry:</span> {entryToPost.entry_number}
                  </div>
                  <div>
                    <span className="font-medium">Business:</span> {entryToPost.business_name}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> {formatCurrency(calculateTotal(entryToPost), "USD")}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePostConfirm} disabled={postMutation.isPending}>
              {postMutation.isPending ? "Posting..." : "Post Entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
