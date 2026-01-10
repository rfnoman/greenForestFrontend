"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types";

const ACCESS_TOKEN_KEY = "greenforest_accountant_access_token";
const REFRESH_TOKEN_KEY = "greenforest_accountant_refresh_token";
const ROLE_ID_KEY = "greenforest_accountant_role_id";

export default function AccountantDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const roleId = localStorage.getItem(ROLE_ID_KEY);
      if (!accessToken) {
        router.push("/accountant/login");
        return;
      }

      apiClient.setAccessToken(accessToken);
      if (roleId) {
        apiClient.setRoleId(roleId);
      }
      try {
        const userData = await authApi.getMe();
        if (userData.user_type !== 'accountant') {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(ROLE_ID_KEY);
          router.push("/accountant/login");
          return;
        }
        setUser(userData);

        // Fetch owners list
        const ownersList = await apiClient.get<User[]>("/users/owners");
        setOwners(ownersList);
      } catch {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(ROLE_ID_KEY);
        router.push("/accountant/login");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ROLE_ID_KEY);
    apiClient.setAccessToken(null);
    apiClient.setRoleId(null);
    router.push("/accountant/login");
  };

  const handleImpersonate = async (ownerEmail: string) => {
    try {
      const response = await apiClient.post<{ access: string; refresh: string; user: User; role_id?: string }>(
        "/users/impersonate",
        { email: ownerEmail }
      );

      // Store impersonated user's tokens in the main app's storage
      localStorage.setItem("greenforest_access_token", response.access);
      localStorage.setItem("greenforest_refresh_token", response.refresh);
      // Store the role_id (use response.role_id if available, otherwise use the impersonated user's id)
      const roleId = response.role_id || response.user.id;
      localStorage.setItem("greenforest_role_id", roleId);
      // Set flag to indicate this is an impersonated session
      localStorage.setItem("greenforest_impersonated", "true");

      toast.success(`Now viewing as ${response.user.email}`);

      // Redirect to main dashboard
      window.location.href = "/";
    } catch {
      toast.error("Failed to impersonate user");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold">GreenForest</span>
              <span className="text-xs text-muted-foreground">Accountant Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Accountant Dashboard</h1>
          <p className="text-muted-foreground">Select a client to manage their account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Accounts
            </CardTitle>
            <CardDescription>
              Click on a client to access their dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {owners.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No client accounts found</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {owners.map((owner) => (
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
      </main>
    </div>
  );
}
