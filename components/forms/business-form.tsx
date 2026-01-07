"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesApi } from "@/lib/api/businesses";
import { CURRENCIES, FISCAL_MONTHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  FormDescription,
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

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  fiscal_year_end_month: z.number().min(1).max(12),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BusinessFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: BusinessFormDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      industry: "",
      currency: "USD",
      fiscal_year_end_month: 12,
      email: "",
      phone: "",
    },
  });

  const createBusiness = useMutation({
    mutationFn: (data: BusinessFormData) =>
      businessesApi.create({
        name: data.name,
        industry: data.industry || undefined,
        currency: data.currency,
        fiscal_year_end_month: data.fiscal_year_end_month,
        email: data.email || undefined,
        phone: data.phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Business created successfully");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to create business");
    },
  });

  const onSubmit = (data: BusinessFormData) => {
    createBusiness.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Business</DialogTitle>
          <DialogDescription>
            Set up your business to start using GreenForest
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Business" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Technology, Retail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
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
                name="fiscal_year_end_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year End</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FISCAL_MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@business.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createBusiness.isPending}>
                {createBusiness.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Business
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Standalone page component for when user has no businesses
export function CreateBusinessPage({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      industry: "",
      currency: "USD",
      fiscal_year_end_month: 12,
      email: "",
      phone: "",
    },
  });

  const createBusiness = useMutation({
    mutationFn: (data: BusinessFormData) =>
      businessesApi.create({
        name: data.name,
        industry: data.industry || undefined,
        currency: data.currency,
        fiscal_year_end_month: data.fiscal_year_end_month,
        email: data.email || undefined,
        phone: data.phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Business created successfully");
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to create business");
    },
  });

  const onSubmit = (data: BusinessFormData) => {
    createBusiness.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to GreenForest</CardTitle>
          <CardDescription>
            Create your first business to get started with accounting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Business" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Retail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
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
                  name="fiscal_year_end_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiscal Year End</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FISCAL_MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Month when your fiscal year ends
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@business.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createBusiness.isPending}>
                {createBusiness.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Business
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
