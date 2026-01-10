"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { journalEntriesApi } from "@/lib/api/journal-entries";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { useAuth } from "@/lib/hooks/use-auth";
import { journalEntrySchema, JournalEntryFormData } from "@/lib/utils/validation";
import { formatCurrency, parseDecimal } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export default function NewJournalEntryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const currency = currentBusiness?.currency || "USD";
  const canPostJournal = user?.user_type === "accountant_supervisor";

  const createEntry = useMutation({
    mutationFn: (data: JournalEntryFormData) => journalEntriesApi.create({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      lines: [
        { account_id: "", description: "", debit: "0", credit: "0" },
        { account_id: "", description: "", debit: "0", credit: "0" },
      ],
      auto_post: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = form.watch("lines");

  const totalDebits = lines.reduce((sum, line) => sum + parseDecimal(line.debit || "0"), 0);
  const totalCredits = lines.reduce((sum, line) => sum + parseDecimal(line.credit || "0"), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const onSubmit = async (data: JournalEntryFormData) => {
    try {
      await createEntry.mutateAsync(data);
      toast.success("Journal entry created");
      router.push("/journal-entries");
    } catch {
      toast.error("Failed to create journal entry");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/journal-entries"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Journal Entry</h1>
          <p className="text-muted-foreground">Create a manual journal entry</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Entry Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="entry_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="Entry description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lines</CardTitle></CardHeader>
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
                        <FormField control={form.control} name={`lines.${index}.account_id`} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="Account" /></SelectTrigger>
                            <SelectContent>
                              {accounts?.map((account) => (
                                <SelectItem key={account.id} value={account.id}>{account.code} - {account.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )} />
                      </TableCell>
                      <TableCell>
                        <FormField control={form.control} name={`lines.${index}.description`} render={({ field }) => (
                          <Input {...field} placeholder="Line description" className="h-8" />
                        )} />
                      </TableCell>
                      <TableCell>
                        <FormField control={form.control} name={`lines.${index}.debit`} render={({ field }) => (
                          <Input {...field} type="number" step="0.01" className="h-8" />
                        )} />
                      </TableCell>
                      <TableCell>
                        <FormField control={form.control} name={`lines.${index}.credit`} render={({ field }) => (
                          <Input {...field} type="number" step="0.01" className="h-8" />
                        )} />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2} className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => append({ account_id: "", description: "", debit: "0", credit: "0" })}>
                        <Plus className="h-4 w-4 mr-2" />Add Line
                      </Button>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${!isBalanced ? "text-red-600" : ""}`}>
                      {formatCurrency(totalDebits, currency)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${!isBalanced ? "text-red-600" : ""}`}>
                      {formatCurrency(totalCredits, currency)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              {!isBalanced && (
                <p className="text-sm text-destructive mt-2">Debits and credits must be equal</p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            {canPostJournal ? (
              <FormField control={form.control} name="auto_post" render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Post immediately</FormLabel>
                </FormItem>
              )} />
            ) : (
              <div />
            )}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={createEntry.isPending || !isBalanced}>
                {createEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Entry
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
