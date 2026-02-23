"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Leaf, Rss, FileSpreadsheet, Users, LayoutDashboard, ClipboardCheck, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/cn";
import { useSidebar } from "@/lib/hooks/use-sidebar";
import type { User } from "@/lib/types";

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

interface AccountantHeaderProps {
  user: User | null;
  role: "accountant" | "accountant_supervisor";
  onLogout: () => Promise<void>;
}

export function AccountantHeader({ user, role, onLogout }: AccountantHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const basePath = role === "accountant" ? "/accountant" : "/accountant-supervisor";
  const navigation = getNavItems(basePath, role);
  const roleLabel = role === "accountant" ? "Accountant" : "Supervisor";

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-primary" />
                  <div className="flex flex-col">
                    <span>GreenForest</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {roleLabel}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 py-2">
                <nav className="grid gap-1 px-2">
                  {navigation.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
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
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="flex-1" />

        <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
