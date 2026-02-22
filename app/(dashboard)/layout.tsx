"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBusiness } from "@/lib/hooks/use-business";
import { SidebarProvider } from "@/lib/hooks/use-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateBusinessPage } from "@/components/forms/business-form";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading, user, logout } = useAuth();
  const { businesses, isLoading: isBusinessLoading, refreshBusinesses } = useBusiness();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading || isBusinessLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-8 mx-auto rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show create business page if user has no businesses
  if (businesses.length === 0) {
    if (user?.user_type === "manager") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/80 via-emerald-50/40 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-900 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to GreenForest</CardTitle>
              <CardDescription>
                You haven&apos;t been assigned to any business yet. Please ask a
                business owner to invite you as a member.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={() => logout()}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <CreateBusinessPage onSuccess={refreshBusinesses} />;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        <ImpersonationBanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto bg-gradient-to-br from-green-50/80 via-emerald-50/40 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-900 p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
