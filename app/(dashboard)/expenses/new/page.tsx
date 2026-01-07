"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { expensesApi } from "@/lib/api/expenses";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { useVendors } from "@/lib/hooks/use-contacts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { expenseSchema, ExpenseFormData } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewExpensePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: vendors } = useVendors();
  const { data: expenseAccounts } = useAccounts({ account_type: "expense" });
  const { data: bankAccounts } = useQuery({ queryKey: ["bank-accounts"], queryFn: () => bankAccountsApi.list() });

  const createExpense = useMutation({
    mutationFn: (data: ExpenseFormData) => expensesApi.create({
      date: data.date,
      amount: data.amount,
      category_id: data.category_id,
      vendor_id: data.vendor_id || undefined,
      bank_account_id: data.bank_account_id,
      description: data.description || undefined,
      reference: data.reference || undefined,
      receipt_url: data.receipt_url || undefined,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      category_id: "",
      vendor_id: "",
      bank_account_id: "",
      description: "",
      reference: "",
      receipt_url: "",
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await createExpense.mutateAsync(data);
      toast.success("Expense recorded successfully");
      router.push("/expenses");
    } catch {
      toast.error("Failed to record expense");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Expense</h1>
          <p className="text-muted-foreground">Add a new business expense</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Expense Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {expenseAccounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vendor_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} defaultValue={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No vendor</SelectItem>
                        {vendors?.map((vendor) => <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bank_account_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid From</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {bankAccounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reference" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl><Input placeholder="Check #, Receipt #..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Expense description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="receipt_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL (Optional)</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={createExpense.isPending}>
                  {createExpense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Expense
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
