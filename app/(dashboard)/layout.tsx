"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBusiness } from "@/lib/hooks/use-business";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBusinessPage } from "@/components/forms/business-form";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
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
    return <CreateBusinessPage onSuccess={refreshBusinesses} />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/10 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
