"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BillForm } from "@/components/forms/bill-form";

export default function NewBillPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bills">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Bill</h1>
          <p className="text-muted-foreground">Record a new vendor bill</p>
        </div>
      </div>
      <BillForm />
    </div>
  );
}
