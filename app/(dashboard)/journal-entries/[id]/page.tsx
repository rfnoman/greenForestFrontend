"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle, Ban, Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journalEntriesApi } from "@/lib/api/journal-entries";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { useAuth } from "@/lib/hooks/use-auth";
import { journalEntrySchema, JournalEntryFormData } from "@/lib/utils/validation";
import { formatCurrency, formatDate, parseDecimal } from "@/lib/utils/format";
import { JOURNAL_ENTRY_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntryStatus } from "@/lib/types";

export default function JournalEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const currency = currentBusiness?.currency || "USD";
  const canPostJournal = user?.user_type === "accountant_supervisor";

  const [isEditing, setIsEditing] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: entry, isLoading, error } = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => journalEntriesApi.get(id),
    enabled: !!id,
  });

  const updateEntry = useMutation({
    mutationFn: (data: JournalEntryFormData) =>
      journalEntriesApi.update(id, {
        entry_date: data.entry_date,
        description: data.description || undefined,
        lines: data.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description || undefined,
          debit: line.debit,
          credit: line.credit,
        })),
        auto_post: data.auto_post,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setIsEditing(false);
      toast.success("Journal entry updated");
    },
    onError: () => {
      toast.error("Failed to update journal entry");
    },
  });

  const postEntry = useMutation({
    mutationFn: () => journalEntriesApi.post(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Journal entry posted");
    },
    onError: () => {
      toast.error("Failed to post journal entry");
    },
  });

  const voidEntry = useMutation({
    mutationFn: (reason: string) => journalEntriesApi.void(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setVoidDialogOpen(false);
      toast.success("Journal entry voided");
    },
    onError: () => {
      toast.error("Failed to void journal entry");
    },
  });

  const deleteEntry = useMutation({
    mutationFn: () => journalEntriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Journal entry deleted");
      router.push("/journal-entries");
    },
    onError: () => {
      toast.error("Failed to delete journal entry");
    },
  });

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_date: "",
      description: "",
      lines: [],
      auto_post: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Reset form when entry data loads or when editing mode changes
  useEffect(() => {
    if (entry && isEditing) {
      form.reset({
        entry_date: entry.entry_date,
        description: entry.description || "",
        lines: entry.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description || "",
          debit: line.debit,
          credit: line.credit,
        })),
        auto_post: false,
      });
    }
  }, [entry, isEditing, form]);

  const lines = form.watch("lines");
  const totalDebits = lines.reduce((sum, line) => sum + parseDecimal(line.debit || "0"), 0);
  const totalCredits = lines.reduce((sum, line) => sum + parseDecimal(line.credit || "0"), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const onSubmit = async (data: JournalEntryFormData) => {
    await updateEntry.mutateAsync(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (entry) {
      form.reset({
        entry_date: entry.entry_date,
        description: entry.description || "",
        lines: entry.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description || "",
          debit: line.debit,
          credit: line.credit,
        })),
        auto_post: false,
      });
    }
  };

  const getStatusBadge = (status: JournalEntryStatus) => {
    let variant: "default" | "success" | "secondary" = "default";
    switch (status) {
      case "posted":
        variant = "success";
        break;
      case "draft":
      case "voided":
        variant = "secondary";
        break;
    }
    const statusConfig = JOURNAL_ENTRY_STATUSES.find((s) => s.value === status);
    return <Badge variant={variant}>{statusConfig?.label || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/journal-entries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal Entry Not Found</h1>
            <p className="text-muted-foreground">
              The journal entry you are looking for does not exist.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/journal-entries">Back to Journal Entries</Link>
        </Button>
      </div>
    );
  }

  const isDraft = entry.status === "draft";
  const isPosted = entry.status === "posted";
  const isVoided = entry.status === "voided";
  const canEdit = isDraft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/journal-entries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{entry.entry_number}</h1>
              {getStatusBadge(entry.status)}
            </div>
            <p className="text-muted-foreground">
              {entry.source_type === "manual" ? "Manual entry" : `From ${entry.source_type}`}
              {" • "}Created {formatDate(entry.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteEntry.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          {isDraft && canPostJournal && !isEditing && (
            <Button onClick={() => postEntry.mutate()} disabled={postEntry.isPending}>
              {postEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Post
            </Button>
          )}
          {isPosted && (
            <Button
              variant="destructive"
              onClick={() => setVoidDialogOpen(true)}
              disabled={voidEntry.isPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              Void
            </Button>
          )}
        </div>
      </div>

      {/* Edit Mode */}
      {isEditing && canEdit ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Entry Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="entry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Entry description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lines</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[120px]">Debit</TableHead>
                      <TableHead className="w-[120px]">Credit</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.account_id`}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts?.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.code} - {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.description`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                placeholder="Line description"
                                className="h-8"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.debit`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                className="h-8"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.credit`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                className="h-8"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 2}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            append({
                              account_id: "",
                              description: "",
                              debit: "0",
                              credit: "0",
                            })
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Line
                        </Button>
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${!isBalanced ? "text-red-600" : ""}`}
                      >
                        {formatCurrency(totalDebits, currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${!isBalanced ? "text-red-600" : ""}`}
                      >
                        {formatCurrency(totalCredits, currency)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                {!isBalanced && (
                  <p className="text-sm text-destructive mt-2">
                    Debits and credits must be equal
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateEntry.isPending || !isBalanced}
              >
                {updateEntry.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        /* View Mode */
        <>
          <Card>
            <CardHeader>
              <CardTitle>Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(entry.entry_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{entry.description || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium capitalize">{entry.source_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(entry.status)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          {(isPosted || isVoided) && (
            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {isPosted && entry.posted_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Posted At</p>
                    <p className="font-medium">{formatDate(entry.posted_at)}</p>
                  </div>
                )}
                {isVoided && (
                  <>
                    {entry.voided_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Voided At</p>
                        <p className="font-medium">{formatDate(entry.voided_at)}</p>
                      </div>
                    )}
                    {entry.void_reason && (
                      <div>
                        <p className="text-sm text-muted-foreground">Void Reason</p>
                        <p className="font-medium">{entry.void_reason}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Lines</CardTitle>
              <CardDescription>
                {entry.lines.length} line{entry.lines.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <TableCell className="font-medium">
                        {line.account_code} - {line.account_name}
                      </TableCell>
                      <TableCell>{line.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        {parseFloat(line.debit) > 0
                          ? formatCurrency(parseFloat(line.debit), currency)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(line.credit) > 0
                          ? formatCurrency(parseFloat(line.credit), currency)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        entry.lines.reduce(
                          (sum, line) => sum + parseFloat(line.debit || "0"),
                          0
                        ),
                        currency
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        entry.lines.reduce(
                          (sum, line) => sum + parseFloat(line.credit || "0"),
                          0
                        ),
                        currency
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Void Confirmation Dialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void entry #{entry.entry_number}? This will reverse
              all accounting effects. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voidEntry.mutate("Voided by user")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {voidEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Void Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete entry #{entry.entry_number}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEntry.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
