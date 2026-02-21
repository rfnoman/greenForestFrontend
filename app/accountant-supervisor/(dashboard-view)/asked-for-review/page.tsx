"use client";

import { useState, useEffect } from "react";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, ArrowUpDown, FileText, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useAllJournalEntries } from "@/lib/hooks/use-all-journal-entries";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntryWithBusiness } from "@/lib/types";
import { JournalEntryQuickView } from "@/components/supervisor/journal-entry-quick-view";
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

type SortField = "entry_date" | "entry_number" | "business_name" | "created_at";

export default function AskedForReviewPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryWithBusiness | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [entryToPost, setEntryToPost] = useState<JournalEntryWithBusiness | null>(null);

  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== debouncedSearch) setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, refetch, isFetching } = useAllJournalEntries({
    page,
    page_size: pageSize,
    status: "ask_for_review",
    search: debouncedSearch || undefined,
    sort_by: sortField,
    sort_order: sortDirection,
  });

  const entries = data?.items;
  const totalPages = data?.total_pages ?? 0;
  const totalItems = data?.total ?? 0;

  const postMutation = useMutation({
    mutationFn: ({ entryId, businessId }: { entryId: string; businessId: string }) =>
      supervisorApi.postJournalEntry(entryId, businessId),
    onSuccess: () => {
      toast.success("Journal entry posted successfully");
      queryClient.invalidateQueries({ queryKey: ["all-journal-entries"] });
      setPostDialogOpen(false);
      setEntryToPost(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to post journal entry");
    },
  });

  const calculateTotal = (entry: JournalEntryWithBusiness) => {
    return entry.lines.reduce((sum, line) => sum + parseFloat(line.debit || "0"), 0);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

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

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asked for Review</h1>
          <p className="text-muted-foreground">Journal entries awaiting your review and approval</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entries for Review</CardTitle>
          <CardDescription>
            {totalItems} {totalItems === 1 ? "entry" : "entries"} awaiting review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Entries for Review</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {debouncedSearch
                  ? "No entries found matching your search"
                  : "There are no journal entries awaiting review"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort("entry_date")}>
                          Date <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort("entry_number")}>
                          Entry # <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort("business_name")}>
                          Business <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.entry_date)}</TableCell>
                        <TableCell className="font-medium">{entry.entry_number}</TableCell>
                        <TableCell>{entry.business_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Asked for Review</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description || "\u2014"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(calculateTotal(entry), "USD")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleView(entry)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {entries.length} of {totalItems} entries</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-[80px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              Are you sure you want to post this journal entry? This action cannot be undone.
              {entryToPost && (
                <span className="mt-4 space-y-2 text-sm block">
                  <span className="block">
                    <span className="font-medium">Entry:</span> {entryToPost.entry_number}
                  </span>
                  <span className="block">
                    <span className="font-medium">Business:</span> {entryToPost.business_name}
                  </span>
                  <span className="block">
                    <span className="font-medium">Total:</span> {formatCurrency(calculateTotal(entryToPost), "USD")}
                  </span>
                </span>
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
    </div>
  );
}
