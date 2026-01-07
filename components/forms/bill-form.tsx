"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCreateBill } from "@/lib/hooks/use-bills";
import { useVendors } from "@/lib/hooks/use-contacts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { billSchema, BillFormData } from "@/lib/utils/validation";
import { formatCurrency, parseDecimal } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export function BillForm() {
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const { data: vendors } = useVendors();
  const { data: accounts } = useAccounts({ account_type: "expense" });
  const createBill = useCreateBill();
  const currency = currentBusiness?.currency || "USD";

  const form = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      vendor_id: "",
      bill_number: "",
      bill_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      line_items: [{ account_id: "", description: "", amount: "0" }],
      tax_amount: "0",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "line_items" });

  const lineItems = form.watch("line_items");
  const taxAmount = parseDecimal(form.watch("tax_amount") || "0");
  const subtotal = lineItems.reduce((sum, item) => sum + parseDecimal(item.amount || "0"), 0);
  const total = subtotal + taxAmount;

  const onSubmit = async (data: BillFormData) => {
    try {
      await createBill.mutateAsync({
        vendor_id: data.vendor_id,
        bill_number: data.bill_number || undefined,
        bill_date: data.bill_date,
        due_date: data.due_date,
        line_items: data.line_items.map((item) => ({
          account_id: item.account_id,
          description: item.description,
          amount: item.amount,
        })),
        tax_amount: data.tax_amount,
        notes: data.notes,
      });
      toast.success("Bill created successfully");
      router.push("/bills");
    } catch {
      toast.error("Failed to create bill");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Bill Details</CardTitle></CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-4">
              <FormField control={form.control} name="vendor_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vendors?.map((vendor) => <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bill_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Number</FormLabel>
                  <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bill_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[150px]">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FormField control={form.control} name={`line_items.${index}.account_id`} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Account" /></SelectTrigger>
                          <SelectContent>
                            {accounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </TableCell>
                    <TableCell>
                      <FormField control={form.control} name={`line_items.${index}.description`} render={({ field }) => (
                        <Input {...field} placeholder="Description" className="h-8" />
                      )} />
                    </TableCell>
                    <TableCell>
                      <FormField control={form.control} name={`line_items.${index}.amount`} render={({ field }) => (
                        <Input {...field} type="number" step="0.01" className="h-8" />
                      )} />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => append({ account_id: "", description: "", amount: "0" })}>
                      <Plus className="h-4 w-4 mr-2" />Add Line Item
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
                <div className="flex justify-between items-center gap-2">
                  <span>Tax</span>
                  <FormField control={form.control} name="tax_amount" render={({ field }) => (
                    <Input {...field} type="number" step="0.01" className="w-24 h-8 text-right" />
                  )} />
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(total, currency)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormControl><Textarea {...field} placeholder="Notes..." rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={createBill.isPending}>
            {createBill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Bill
          </Button>
        </div>
      </form>
    </Form>
  );
}
