"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { useBusiness } from "@/lib/hooks/use-business";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessFormDialog } from "@/components/forms/business-form";

export function BusinessSwitcher() {
  const { currentBusiness, businesses, isLoading, setCurrentBusiness, refreshBusinesses } =
    useBusiness();
  const [open, setOpen] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  if (!currentBusiness) {
    return null;
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{currentBusiness.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="max-h-[300px] overflow-auto">
          {businesses.map((business) => (
            <button
              key={business.id}
              onClick={() => {
                setCurrentBusiness(business);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted",
                currentBusiness.id === business.id && "bg-muted"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{business.name}</span>
              {currentBusiness.id === business.id && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </button>
          ))}
        </div>
        <div className="border-t p-1">
          <button
            onClick={() => {
              setOpen(false);
              setShowBusinessForm(true);
            }}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add Business
          </button>
        </div>
      </PopoverContent>
    </Popover>
    <BusinessFormDialog
      open={showBusinessForm}
      onOpenChange={setShowBusinessForm}
      onSuccess={() => refreshBusinesses()}
    />
    </>
  );
}
