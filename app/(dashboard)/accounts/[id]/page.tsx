"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useAccount, useAccountBalance } from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils/format";
import { useBusiness } from "@/lib/hooks/use-business";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AccountFormDialog } from "@/components/forms/account-form";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const { data: account, isLoading } = useAccount(id);
  const { data: balanceData } = useAccountBalance(id);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return <AccountDetailSkeleton />;
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Account not found</h2>
        <p className="text-muted-foreground mt-2">
          The account you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/accounts">Back to Accounts</Link>
        </Button>
      </div>
    );
  }

  const currency = currentBusiness?.currency || "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-muted-foreground">Account Code: {account.code}</p>
        </div>
        <Button onClick={() => setIsEditOpen(true)} disabled={account.is_system}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize font-medium">{account.account_type}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Normal Balance</span>
              <span className="capitalize font-medium">{account.normal_balance}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={account.is_active ? "success" : "secondary"}>
                {account.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {account.is_system && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Account</span>
                  <Badge variant="secondary">Yes</Badge>
                </div>
              </>
            )}
            {account.description && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Description</span>
                  <p className="mt-1">{account.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Current account balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {formatCurrency(balanceData?.balance || "0", currency)}
            </div>
            {balanceData?.as_of_date && (
              <p className="text-sm text-muted-foreground mt-2">
                As of {new Date(balanceData.as_of_date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AccountFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={account}
      />
    </div>
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-40" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
