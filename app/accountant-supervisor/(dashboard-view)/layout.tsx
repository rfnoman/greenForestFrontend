"use client";

import { AccountantAuthProvider, useAccountantAuth } from "@/lib/hooks/use-accountant-auth";
import { SidebarProvider } from "@/lib/hooks/use-sidebar";
import { AccountantSidebar } from "@/components/accountant/accountant-sidebar";
import { AccountantHeader } from "@/components/accountant/accountant-header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function SupervisorLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAccountantAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AccountantSidebar role="accountant_supervisor" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AccountantHeader user={user} role="accountant_supervisor" onLogout={logout} />
          <main className="flex-1 overflow-auto bg-gradient-to-br from-green-50/80 via-emerald-50/40 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-900">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function SupervisorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AccountantAuthProvider role="accountant_supervisor">
        <SupervisorLayoutInner>{children}</SupervisorLayoutInner>
      </AccountantAuthProvider>
    </QueryClientProvider>
  );
}
