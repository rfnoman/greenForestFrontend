"use client";

import { ArrowLeft, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";

export function ImpersonationBanner() {
  const { isImpersonating, user, endImpersonation } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isImpersonating) return null;

  const handleSwitchBack = async () => {
    setIsSwitching(true);
    try {
      await endImpersonation();
    } catch {
      setIsSwitching(false);
    }
  };

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-between gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Viewing as <strong>{user?.first_name} {user?.last_name}</strong> ({user?.email})
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSwitchBack}
        disabled={isSwitching}
        className="h-7 gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isSwitching ? "Switching..." : "Switch back"}
      </Button>
    </div>
  );
}
