"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rss,
  FileSpreadsheet,
  Users,
  Leaf,
  ClipboardCheck,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

function getNavItems(basePath: string, role: "accountant" | "accountant_supervisor"): NavItem[] {
  const items: NavItem[] = [
    { name: "Dashboard", href: `${basePath}/dashboard`, icon: LayoutDashboard },
    { name: "Feed", href: `${basePath}/feed`, icon: Rss },
    { name: "Journal Entries", href: `${basePath}/journal-entries`, icon: FileSpreadsheet },
  ];

  if (role === "accountant_supervisor") {
    items.push({ name: "Asked for Review", href: `${basePath}/asked-for-review`, icon: ClipboardCheck });
  }

  items.push({ name: "Manage User", href: `${basePath}/impersonate`, icon: Users });

  return items;
}

interface AccountantSidebarProps {
  role: "accountant" | "accountant_supervisor";
}

export function AccountantSidebar({ role }: AccountantSidebarProps) {
  const pathname = usePathname();
  const basePath = role === "accountant" ? "/accountant" : "/accountant-supervisor";
  const navigation = getNavItems(basePath, role);
  const roleLabel = role === "accountant" ? "Accountant" : "Supervisor";

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-64">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href={`${basePath}/dashboard`} className="flex items-center gap-2 font-semibold">
            <Leaf className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span>GreenForest</span>
              <span className="text-xs font-normal text-muted-foreground">
                {roleLabel}
              </span>
            </div>
          </Link>
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="grid gap-1 px-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

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
