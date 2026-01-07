"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRecordInvoicePayment } from "@/lib/hooks/use-invoices";
import { useQuery } from "@tanstack/react-query";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { paymentSchema, PaymentFormData } from "@/lib/utils/validation";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  balanceDue: string;
  currency: string;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoiceId,
  balanceDue,
  currency,
}: PaymentFormDialogProps) {
  const recordPayment = useRecordInvoicePayment();
  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balanceDue,
      payment_date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "bank_transfer",
      bank_account_id: "",
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await recordPayment.mutateAsync({
        id: invoiceId,
        data: {
          amount: data.amount,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          bank_account_id: data.bank_account_id,
          reference: data.reference || undefined,
          notes: data.notes || undefined,
        },
      });
      toast.success("Payment recorded successfully");
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Failed to record payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Balance due: {formatCurrency(balanceDue, currency)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
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
              name="bank_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Check number, transaction ID..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Payment notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
