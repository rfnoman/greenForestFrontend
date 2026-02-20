"use client";

import { AccountantAuthProvider, useAccountantAuth } from "@/lib/hooks/use-accountant-auth";
import { AccountantSidebar } from "@/components/accountant/accountant-sidebar";
import { AccountantHeader } from "@/components/accountant/accountant-header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function AccountantLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAccountantAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <AccountantSidebar role="accountant" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AccountantHeader user={user} role="accountant" onLogout={logout} />
        <main className="flex-1 overflow-auto bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AccountantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AccountantAuthProvider role="accountant">
        <AccountantLayoutInner>{children}</AccountantLayoutInner>
      </AccountantAuthProvider>
    </QueryClientProvider>
  );
}
