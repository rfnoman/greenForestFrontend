"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { incomesApi } from "@/lib/api/incomes";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { useCustomers } from "@/lib/hooks/use-contacts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { INCOME_TYPES } from "@/lib/constants";
import { incomeSchema, IncomeFormData } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

// Map income types to suggested account codes for auto-selection
const INCOME_TYPE_ACCOUNT_CODES: Record<string, string> = {
  interest: "421000",
  rental: "422000",
  gain_on_disposal: "423000",
  fx_gain: "424000",
  dividend: "420000",
  grant: "420000",
  insurance: "420000",
  refund: "420000",
  other: "420000",
};

export default function NewIncomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customers } = useCustomers();
  const { data: revenueAccounts } = useAccounts({ account_type: "revenue" });
  const { data: bankAccounts } = useQuery({ queryKey: ["bank-accounts"], queryFn: () => bankAccountsApi.list() });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createIncome = useMutation({
    mutationFn: async ({ data, file }: { data: IncomeFormData; file: File | null }) => {
      const income = await incomesApi.create({
        date: data.date,
        amount: data.amount,
        income_type: data.income_type,
        category_id: data.category_id,
        bank_account_id: data.payment_method === "bank" ? data.bank_account_id || undefined : undefined,
        description: data.description,
        contact_id: data.contact_id || undefined,
        reference: data.reference || undefined,
        receipt_url: data.receipt_url || undefined,
      });
      if (file) {
        return incomesApi.uploadReceipt(income.id, file);
      }
      return income;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incomes"] }),
  });

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      income_type: "other",
      category_id: "",
      payment_method: "bank",
      bank_account_id: "",
      description: "",
      contact_id: "",
      reference: "",
      receipt_url: "",
    },
  });

  const paymentMethod = form.watch("payment_method");

  const handleIncomeTypeChange = (value: string) => {
    form.setValue("income_type", value);
    // Auto-select matching category account based on account code
    const suggestedCode = INCOME_TYPE_ACCOUNT_CODES[value];
    if (suggestedCode && revenueAccounts) {
      const matchingAccount = revenueAccounts.find((a) => a.code === suggestedCode);
      if (matchingAccount) {
        form.setValue("category_id", matchingAccount.id);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const clearFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: IncomeFormData) => {
    try {
      await createIncome.mutateAsync({ data, file: receiptFile });
      toast.success("Income recorded successfully");
      router.push("/income");
    } catch {
      toast.error("Failed to record income");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/income"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Income</h1>
          <p className="text-muted-foreground">Add a new income entry</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Income Details</CardTitle></CardHeader>
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
                <FormField control={form.control} name="income_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Income Type</FormLabel>
                    <Select onValueChange={handleIncomeTypeChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select income type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {INCOME_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {revenueAccounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Payment method toggle */}
                <FormField control={form.control} name="payment_method" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received As</FormLabel>
                    <FormControl>
                      <div className="flex rounded-md border">
                        <button
                          type="button"
                          className={cn(
                            "flex-1 px-4 py-2 text-sm font-medium rounded-l-md transition-colors",
                            field.value === "bank"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => field.onChange("bank")}
                        >
                          Bank Deposit
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "flex-1 px-4 py-2 text-sm font-medium rounded-r-md transition-colors",
                            field.value === "cash"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => {
                            field.onChange("cash");
                            form.setValue("bank_account_id", "");
                          }}
                        >
                          Cash
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {paymentMethod === "bank" && (
                  <FormField control={form.control} name="bank_account_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Into</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {bankAccounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="contact_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} defaultValue={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No customer</SelectItem>
                        {customers?.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reference" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl><Input placeholder="REF-001, Check #..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Income description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Receipt section */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="receipt_url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <FormLabel>Receipt File (Optional)</FormLabel>
                  {receiptFile ? (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <span className="flex-1 truncate">{receiptFile.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload receipt (.jpg, .png, .pdf)</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={createIncome.isPending}>
                  {createIncome.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Income
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
