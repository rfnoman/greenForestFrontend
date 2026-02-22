"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JournalEntryFeed } from "@/components/supervisor/journal-entry-feed";
import { useJournalWebSocket } from "@/lib/hooks/use-journal-websocket";
import { useAccountantAuth } from "@/lib/hooks/use-accountant-auth";
import { BusinessSearchSelect } from "@/components/shared/business-search-select";

function ConnectionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    connected: { color: "bg-green-500", label: "Connected" },
    connecting: { color: "bg-yellow-500", label: "Connecting" },
    disconnected: { color: "bg-red-500", label: "Disconnected" },
    access_denied: { color: "bg-red-500", label: "Access Denied" },
  };

  const { color, label } = config[status] || config.disconnected;

  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color} ${status === "connecting" ? "animate-pulse" : ""}`} />
      {label}
    </Badge>
  );
}

export default function AccountantFeedPage() {
  const { role } = useAccountantAuth();
  const [businessFilter, setBusinessFilter] = useState<string | undefined>(undefined);
  const storageKey = role === "accountant"
    ? "greenforest_accountant_access_token"
    : "greenforest_supervisor_access_token";
  const accessToken = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
  const { status } = useJournalWebSocket(accessToken);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal Entry Feed</h1>
          <p className="text-muted-foreground">Review and post draft journal entries across all businesses</p>
        </div>
        <ConnectionStatusBadge status={status} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Draft Entries</CardTitle>
              <CardDescription>Post entries after review verification</CardDescription>
            </div>
            <BusinessSearchSelect
              value={businessFilter}
              onValueChange={setBusinessFilter}
            />
          </div>
        </CardHeader>
        <CardContent>
          <JournalEntryFeed businessId={businessFilter} />
        </CardContent>
      </Card>
    </div>
  );
}
