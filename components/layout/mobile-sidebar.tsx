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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: BookOpen },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Bills", href: "/bills", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "Journal Entries", href: "/journal-entries", icon: FileSpreadsheet },
  { name: "Banking", href: "/banking/accounts", icon: Landmark },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-4 py-4">
        <SheetTitle className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span>GreenForest</span>
        </SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

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
  );
}
