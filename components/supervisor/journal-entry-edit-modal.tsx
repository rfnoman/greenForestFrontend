"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { supervisorApi } from "@/lib/api/supervisor";
import { journalEntrySchema, JournalEntryFormData } from "@/lib/utils/validation";
import { formatCurrency, parseDecimal } from "@/lib/utils/format";
import type { JournalEntryWithBusiness } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

interface JournalEntryEditModalProps {
  entry: JournalEntryWithBusiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function JournalEntryEditModal({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: JournalEntryEditModalProps) {
  const queryClient = useQueryClient();

  // Fetch accounts for the entry's business
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts", entry.business_id],
    queryFn: () => supervisorApi.getAccounts(entry.business_id),
    enabled: open,
  });

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_date: entry.entry_date,
      description: entry.description || "",
      lines: entry.lines.map((line) => ({
        account_id: line.account_id,
        description: line.description || "",
        debit: line.debit || "0",
        credit: line.credit || "0",
      })),
      auto_post: false,
    },
  });

  // Reset form when entry changes or modal opens
  useEffect(() => {
    if (open) {
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
  }, [open, entry.id]);

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

  const updateMutation = useMutation({
    mutationFn: (data: JournalEntryFormData) =>
      supervisorApi.updateJournalEntry(entry.id, entry.business_id, {
        entry_date: data.entry_date,
        description: data.description || undefined,
        lines: data.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description || undefined,
          debit: line.debit,
          credit: line.credit,
        })),
      }),
    onSuccess: () => {
      toast.success("Journal entry updated");
      queryClient.invalidateQueries({ queryKey: ["all-journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update journal entry"
      );
    },
  });

  const onSubmit = (data: JournalEntryFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Journal Entry: {entry.entry_number}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
              {isLoadingAccounts ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading accounts...
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
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
                            className={`text-right font-bold ${
                              !isBalanced ? "text-red-600" : ""
                            }`}
                          >
                            {formatCurrency(totalDebits, "USD")}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              !isBalanced ? "text-red-600" : ""
                            }`}
                          >
                            {formatCurrency(totalCredits, "USD")}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                  {!isBalanced && (
                    <p className="text-sm text-destructive mt-2">
                      Debits and credits must be equal
                    </p>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !isBalanced}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
