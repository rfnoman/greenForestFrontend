"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Loader2, Building2, Users, Calculator, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import type { UserType } from "@/lib/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OWNER_MANAGER_STORAGE = {
  access: "greenforest_access_token",
  refresh: "greenforest_refresh_token",
  role: "greenforest_role_id",
};

const STAFF_STORAGE = {
  accountant: {
    access: "greenforest_accountant_access_token",
    refresh: "greenforest_accountant_refresh_token",
    role: "greenforest_role_id",
  },
  accountant_supervisor: {
    access: "greenforest_supervisor_access_token",
    refresh: "greenforest_supervisor_refresh_token",
    role: "greenforest_supervisor_role_id",
  },
};

interface RoleOption {
  role: UserType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ownerManagerRoles: RoleOption[] = [
  {
    role: "owner",
    title: "I'm a Business Owner",
    description: "I own or run a business and want to manage my accounting",
    icon: Building2,
  },
  {
    role: "manager",
    title: "I'm a Manager",
    description: "I manage accounting for a business on behalf of the owner",
    icon: Users,
  },
];

const staffRoles: RoleOption[] = [
  {
    role: "accountant",
    title: "I'm an Accountant",
    description: "I handle bookkeeping and accounting for business clients",
    icon: Calculator,
  },
  {
    role: "accountant_supervisor",
    title: "I'm a Supervisor",
    description: "I oversee accountants and review their work across businesses",
    icon: ShieldCheck,
  },
];

function SelectRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginType = searchParams.get("type") as "owner_manager" | "staff" | null;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const isStaff = loginType === "staff";
  const roles = isStaff ? staffRoles : ownerManagerRoles;

  useEffect(() => {
    // Check for the appropriate token based on login type
    const token = localStorage.getItem(
      isStaff ? "greenforest_access_token" : "greenforest_access_token"
    );
    if (!token) {
      router.replace(isStaff ? "/accountant/login" : "/login");
    }
  }, [router, isStaff]);

  const handleSelectRole = async (role: UserType) => {
    setIsLoading(true);
    setSelectedRole(role);
    try {
      const token = localStorage.getItem("greenforest_access_token");
      if (!token) {
        router.replace(isStaff ? "/accountant/login" : "/login");
        return;
      }
      apiClient.setAccessToken(token);
      const data = await authApi.setRole({ user_type: role });

      if (role === "owner" || role === "manager") {
        // Store in owner/manager keys
        localStorage.setItem(OWNER_MANAGER_STORAGE.access, data.access);
        localStorage.setItem(OWNER_MANAGER_STORAGE.refresh, data.refresh);
        localStorage.setItem(OWNER_MANAGER_STORAGE.role, data.user.id);
        window.location.href = "/";
      } else if (role === "accountant_supervisor") {
        // Store in supervisor keys and clean up temp token
        const keys = STAFF_STORAGE.accountant_supervisor;
        localStorage.setItem(keys.access, data.access);
        localStorage.setItem(keys.refresh, data.refresh);
        localStorage.setItem(keys.role, data.user.id);
        localStorage.removeItem("greenforest_access_token");
        localStorage.removeItem("greenforest_refresh_token");
        localStorage.removeItem("greenforest_role_id");
        window.location.href = "/accountant-supervisor/dashboard";
      } else {
        // accountant - store in accountant keys and clean up temp token
        const keys = STAFF_STORAGE.accountant;
        localStorage.setItem(keys.access, data.access);
        localStorage.setItem(keys.refresh, data.refresh);
        localStorage.setItem(keys.role, data.user.id);
        localStorage.removeItem("greenforest_access_token");
        localStorage.removeItem("greenforest_refresh_token");
        localStorage.removeItem("greenforest_role_id");
        window.location.href = "/accountant/dashboard";
      }
    } catch {
      toast.error("Failed to set role. Please try again.");
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">GreenForest</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Choose your role</h1>
        <p className="text-sm text-muted-foreground">
          Select how you&apos;ll be using GreenForest
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roles.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.role}
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                selectedRole === option.role ? "border-primary shadow-md" : ""
              } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
              onClick={() => handleSelectRole(option.role)}
            >
              <CardHeader className="text-center space-y-3">
                {isLoading && selectedRole === option.role ? (
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                ) : (
                  <Icon className="h-10 w-10 text-primary mx-auto" />
                )}
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}
