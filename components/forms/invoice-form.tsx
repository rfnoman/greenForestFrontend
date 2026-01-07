"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCreateInvoice } from "@/lib/hooks/use-invoices";
import { useCustomers } from "@/lib/hooks/use-contacts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBusiness } from "@/lib/hooks/use-business";
import { invoiceSchema, InvoiceFormData } from "@/lib/utils/validation";
import { formatCurrency, parseDecimal } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function InvoiceForm() {
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const { data: customers } = useCustomers();
  const { data: accounts } = useAccounts({ account_type: "revenue" });
  const createInvoice = useCreateInvoice();

  const currency = currentBusiness?.currency || "USD";

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      line_items: [
        { account_id: "", description: "", quantity: "1", unit_price: "0" },
      ],
      tax_rate: "0",
      discount_amount: "0",
      notes: "",
      terms: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  const lineItems = form.watch("line_items");
  const taxRate = parseDecimal(form.watch("tax_rate") || "0");
  const discountAmount = parseDecimal(form.watch("discount_amount") || "0");

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseDecimal(item.quantity || "0");
    const price = parseDecimal(item.unit_price || "0");
    return sum + qty * price;
  }, 0);

  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      await createInvoice.mutateAsync({
        customer_id: data.customer_id,
        issue_date: data.issue_date,
        due_date: data.due_date,
        line_items: data.line_items.map((item) => ({
          account_id: item.account_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        tax_rate: data.tax_rate,
        discount_amount: data.discount_amount,
        notes: data.notes,
        terms: data.terms,
      });
      toast.success("Invoice created successfully");
      router.push("/invoices");
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qty = parseDecimal(lineItems[index]?.quantity || "0");
                  const price = parseDecimal(lineItems[index]?.unit_price || "0");
                  const amount = qty * price;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.account_id`}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts?.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name}
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
                          name={`line_items.${index}.description`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Description" className="h-8" />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.quantity`}
                          render={({ field }) => (
                            <Input {...field} type="number" step="0.01" className="h-8" />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.unit_price`}
                          render={({ field }) => (
                            <Input {...field} type="number" step="0.01" className="h-8" />
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(amount, currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        append({ account_id: "", description: "", quantity: "1", unit_price: "0" })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span>Discount</span>
                  <FormField
                    control={form.control}
                    name="discount_amount"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="w-24 h-8 text-right"
                      />
                    )}
                  />
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span>Tax Rate (%)</span>
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="w-24 h-8 text-right"
                      />
                    )}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax Amount</span>
                  <span>{formatCurrency(taxAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Notes visible to customer..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Payment terms..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
