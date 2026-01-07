"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesApi } from "@/lib/api/businesses";
import { useBusiness } from "@/lib/hooks/use-business";
import { CURRENCIES, MONTHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  fiscal_year_end_month: z.number().min(1).max(12),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export default function BusinessSettingsPage() {
  const { currentBusiness } = useBusiness();
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
      tax_id: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
    },
  });

  useEffect(() => {
    if (currentBusiness) {
      form.reset({
        name: currentBusiness.name,
        industry: currentBusiness.industry || "",
        currency: currentBusiness.currency,
        fiscal_year_end_month: currentBusiness.fiscal_year_end_month,
        email: currentBusiness.email || "",
        phone: currentBusiness.phone || "",
        tax_id: currentBusiness.tax_id || "",
        address: {
          line1: currentBusiness.address?.line1 || "",
          line2: currentBusiness.address?.line2 || "",
          city: currentBusiness.address?.city || "",
          state: currentBusiness.address?.state || "",
          postal_code: currentBusiness.address?.postal_code || "",
          country: currentBusiness.address?.country || "",
        },
      });
    }
  }, [currentBusiness, form]);

  const updateBusiness = useMutation({
    mutationFn: (data: BusinessFormData) =>
      businessesApi.update(currentBusiness!.id, {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        tax_id: data.tax_id || undefined,
        industry: data.industry || undefined,
        address: Object.values(data.address || {}).some(Boolean)
          ? data.address
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Business updated successfully");
    },
    onError: () => {
      toast.error("Failed to update business");
    },
  });

  const onSubmit = (data: BusinessFormData) => {
    updateBusiness.mutate(data);
  };

  if (!currentBusiness) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground">
            Manage your business information
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-muted-foreground">
          Manage your business information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Basic details about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business name" {...field} />
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
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Technology, Retail" {...field} />
                      </FormControl>
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
                      <FormLabel>Business Email</FormLabel>
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / EIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Tax identification number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>
                Currency and fiscal year configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormDescription>
                        Primary currency for transactions
                      </FormDescription>
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
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map((month) => (
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Address</CardTitle>
              <CardDescription>
                Physical address for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address.line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address.postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateBusiness.isPending}>
              {updateBusiness.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
