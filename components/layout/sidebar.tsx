"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Landmark,
  BarChart3,
  Settings,
  Leaf,
  FileSpreadsheet,
  Upload,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/hooks/use-auth";
import type { UserType } from "@/lib/types";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedUserTypes?: UserType[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Upload Expense", href: "/upload-expense", icon: Upload, allowedUserTypes: ["owner", "manager"] },
  { name: "Accounts", href: "/accounts", icon: BookOpen, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Contacts", href: "/contacts", icon: Users, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Invoices", href: "/invoices", icon: FileText, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Bills", href: "/bills", icon: Receipt, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Expenses", href: "/expenses", icon: CreditCard, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Journal Entries", href: "/journal-entries", icon: FileSpreadsheet, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Banking", href: "/banking/accounts", icon: Landmark, allowedUserTypes: ["accountant", "accountant_supervisor"] },
  { name: "Reports", href: "/reports", icon: BarChart3, allowedUserTypes: ["owner", "manager", "accountant", "accountant_supervisor"] },
  { name: "Settings", href: "/settings", icon: Settings, allowedUserTypes: ["accountant", "accountant_supervisor"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    // Always show items without restrictions (like Dashboard)
    if (!item.allowedUserTypes) return true;
    // Hide restricted items if user is not loaded yet
    if (!user?.user_type) return false;
    // Only show if user's type is in the allowed list
    return item.allowedUserTypes.includes(user.user_type);
  });

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-64">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span>GreenForest</span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.user_type === 'owner' && 'Owner'}
                {user?.user_type === 'manager' && 'Manager'}
                {user?.user_type === 'accountant' && 'Accountant'}
                {user?.user_type === 'accountant_supervisor' && 'Accountant Supervisor'}
              </span>
            </div>
          </Link>
        </div>
        
        <ScrollArea className="flex-1 py-2">
          <nav className="grid gap-1 px-2">
            {filteredNavigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}
