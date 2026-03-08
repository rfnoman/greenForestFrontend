"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";

function AccountantOneAuthCallbackContent() {
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("q");
    if (!token) {
      toast.error("Invalid callback. Missing authentication token.");
      window.location.href = "/accountant/login";
      return;
    }

    authApi
      .oneAuthLogin({ one_auth_token: token, login_type: "staff" })
      .then((data) => {
        apiClient.setAccessToken(data.access);

        if (data.is_new_user || data.user.user_type === null) {
          // New staff user — store temp tokens and redirect to role selection
          localStorage.setItem("greenforest_access_token", data.access);
          localStorage.setItem("greenforest_refresh_token", data.refresh);
          localStorage.setItem("greenforest_role_id", data.role_id);
          window.location.href = "/select-role?type=staff";
        } else if (data.user.user_type === "accountant_supervisor") {
          localStorage.setItem("greenforest_supervisor_access_token", data.access);
          localStorage.setItem("greenforest_supervisor_refresh_token", data.refresh);
          localStorage.setItem("greenforest_supervisor_role_id", data.role_id);
          toast.success("Welcome back, Supervisor!");
          window.location.href = "/accountant-supervisor/dashboard";
        } else {
          localStorage.setItem("greenforest_accountant_access_token", data.access);
          localStorage.setItem("greenforest_accountant_refresh_token", data.refresh);
          localStorage.setItem("greenforest_role_id", data.role_id);
          toast.success("Welcome back, Accountant!");
          window.location.href = "/accountant/dashboard";
        }
      })
      .catch(() => {
        toast.error("Authentication failed. Please try again.");
        window.location.href = "/accountant/login";
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-gray-950 dark:via-emerald-950/30 dark:to-gray-900">
      <div className="flex items-center gap-2 mb-6">
        <Leaf className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">GreenForest</span>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
    </div>
  );
}

export default function AccountantOneAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-gray-950 dark:via-emerald-950/30 dark:to-gray-900">
          <div className="flex items-center gap-2 mb-6">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">GreenForest</span>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
        </div>
      }
    >
      <AccountantOneAuthCallbackContent />
    </Suspense>
  );
}
