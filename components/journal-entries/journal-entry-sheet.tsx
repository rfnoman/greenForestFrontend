"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Ban,
  Pencil,
  User,
} from "lucide-react";
import { journalEntriesApi } from "@/lib/api/journal-entries";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { useAuth } from "@/lib/hooks/use-auth";
import { journalEntrySchema, JournalEntryFormData } from "@/lib/utils/validation";
import { formatCurrency, formatDate, parseDecimal } from "@/lib/utils/format";
import { JOURNAL_ENTRY_STATUSES } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useState } from "react";
import type { JournalEntry, JournalEntryStatus } from "@/lib/types";

interface JournalEntrySheetProps {
  entry: JournalEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEntrySheet({
  entry,
  open,
  onOpenChange,
}: JournalEntrySheetProps) {
  const queryClient = useQueryClient();
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const currency = currentBusiness?.currency || "USD";
  const canPostJournal = user?.user_type === "accountant_supervisor";

  const [isEditing, setIsEditing] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);

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

  const lines = form.watch("lines");
  const totalDebits = lines.reduce(
    (sum, line) => sum + parseDecimal(line.debit || "0"),
    0
  );
  const totalCredits = lines.reduce(
    (sum, line) => sum + parseDecimal(line.credit || "0"),
    0
  );
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  useEffect(() => {
    if (entry && isEditing) {
      form.reset({
        entry_date: entry.entry_date,
        description: entry.description || "",
        lines: entry.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description || "",
          debit: line.debit || "0",
          credit: line.credit || "0",
        })),
        auto_post: false,
      });
    }
  }, [entry, isEditing]);

  // Reset edit mode when sheet closes
  useEffect(() => {
    if (!open) setIsEditing(false);
  }, [open]);

  const updateEntry = useMutation({
    mutationFn: (data: JournalEntryFormData) =>
      journalEntriesApi.update(entry!.id, {
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
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", entry?.id] });
      setIsEditing(false);
      toast.success("Journal entry updated");
    },
    onError: () => toast.error("Failed to update journal entry"),
  });

  const postEntry = useMutation({
    mutationFn: () => journalEntriesApi.post(entry!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", entry?.id] });
      toast.success("Journal entry posted");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to post journal entry"),
  });

  const voidEntry = useMutation({
    mutationFn: () => journalEntriesApi.void(entry!.id, "Voided by user"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", entry?.id] });
      setVoidDialogOpen(false);
      toast.success("Journal entry voided");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to void journal entry"),
  });

  if (!entry) return null;

  const isDraft = entry.status === "draft";
  const isPosted = entry.status === "posted";

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

  const totalDebit = entry.lines.reduce(
    (sum, line) => sum + parseFloat(line.debit || "0"),
    0
  );
  const totalCredit = entry.lines.reduce(
    (sum, line) => sum + parseFloat(line.credit || "0"),
    0
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {entry.entry_number}
              {getStatusBadge(entry.status)}
            </SheetTitle>
            <SheetDescription>
              {entry.source_type === "manual" ? "Manual entry" : `From ${entry.source_type}`}
              {" · "}Created {formatDate(entry.created_at)}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {isEditing ? (
              /* Edit Mode */
              <Form {...form}>
                <form
                  id="je-sheet-edit-form"
                  onSubmit={form.handleSubmit((data) => updateEntry.mutate(data))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[160px]">Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px]">Debit</TableHead>
                            <TableHead className="w-[100px]">Credit</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
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
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Account" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {accounts?.map((account) => (
                                          <SelectItem
                                            key={account.id}
                                            value={account.id}
                                          >
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
                                      placeholder="Description"
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
                            <TableCell />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                    {!isBalanced && (
                      <p className="text-sm text-destructive mt-2">
                        Debits and credits must be equal
                      </p>
                    )}
                  </div>
                </form>
              </Form>
            ) : (
              /* View Mode */
              <>
                {/* Entry Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Entry Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <div className="font-medium">{formatDate(entry.entry_date)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <div className="font-medium capitalize">{entry.source_type}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Description:</span>
                      <div className="font-medium">{entry.description || "—"}</div>
                    </div>
                    {(entry.status === "posted" || entry.status === "voided") && (
                      <>
                        {entry.posted_at && (
                          <div>
                            <span className="text-muted-foreground">Posted At:</span>
                            <div className="font-medium">{formatDate(entry.posted_at)}</div>
                          </div>
                        )}
                        {entry.voided_at && (
                          <div>
                            <span className="text-muted-foreground">Voided At:</span>
                            <div className="font-medium">{formatDate(entry.voided_at)}</div>
                          </div>
                        )}
                        {entry.void_reason && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Void Reason:</span>
                            <div className="font-medium">{entry.void_reason}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Contact */}
                {entry.contact && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Contact</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{entry.contact.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {entry.contact.type}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Line Items */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Line Items ({entry.lines.length})
                  </h4>
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
                                <div className="text-muted-foreground text-xs">
                                  {line.account_code}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {line.description || "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {parseFloat(line.debit || "0") > 0
                                ? formatCurrency(parseFloat(line.debit), currency)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {parseFloat(line.credit || "0") > 0
                                ? formatCurrency(parseFloat(line.credit), currency)
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
                            {formatCurrency(totalDebit, currency)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(totalCredit, currency)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>

          <SheetFooter className="mt-6 gap-2 flex-wrap">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="je-sheet-edit-form"
                  disabled={updateEntry.isPending || !isBalanced}
                >
                  {updateEntry.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {isDraft && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isDraft && canPostJournal && (
                  <Button
                    onClick={() => postEntry.mutate()}
                    disabled={postEntry.isPending}
                  >
                    {postEntry.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
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
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void entry #{entry.entry_number}? This will
              reverse all accounting effects. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voidEntry.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {voidEntry.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Void Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
