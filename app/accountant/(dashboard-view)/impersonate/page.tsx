"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAccountantAuth } from "@/lib/hooks/use-accountant-auth";

export default function AccountantImpersonatePage() {
  const { owners, handleImpersonate } = useAccountantAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOwners = owners.filter((owner) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${owner.first_name || ""} ${owner.last_name || ""}`.toLowerCase();
    const username = (owner.username || "").toLowerCase();
    const email = owner.email.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      username.includes(searchLower) ||
      email.includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage User</h1>
        <p className="text-muted-foreground">Select a client to access their dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Accounts
          </CardTitle>
          <CardDescription>Click on a client to access their dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {owners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No client accounts found</p>
          ) : filteredOwners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No clients match your search</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOwners.map((owner) => (
                <Card
                  key={owner.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleImpersonate(owner.email)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {owner.first_name?.[0] || owner.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {owner.first_name && owner.last_name
                            ? `${owner.first_name} ${owner.last_name}`
                            : owner.username || owner.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{owner.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
