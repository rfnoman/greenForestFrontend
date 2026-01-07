"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">
            Create a new customer invoice
          </p>
        </div>
      </div>

      <InvoiceForm />
    </div>
  );
}
