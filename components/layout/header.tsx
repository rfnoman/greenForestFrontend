"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "./user-nav";
import { BusinessSwitcher } from "./business-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import { useSidebar } from "@/lib/hooks/use-sidebar";

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebar />
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

      <div className="flex-1">
        <BusinessSwitcher />
      </div>

      <UserNav />
    </header>
  );
}
