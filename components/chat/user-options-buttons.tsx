"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";
import type { UserOptionsData } from "@/lib/hooks/use-chat";

interface UserOptionsButtonsProps {
  data: UserOptionsData;
  selectedOption?: string;
  onSelect: (option: string) => void;
}

export const UserOptionsButtons = memo(function UserOptionsButtons({
  data,
  selectedOption,
  onSelect,
}: UserOptionsButtonsProps) {
  const isDisabled = !!selectedOption;

  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed">{data.question}</p>
      <div className="flex flex-wrap gap-2">
        {data.options.map((option) => (
          <Button
            key={option}
            variant={selectedOption === option ? "default" : "outline"}
            size="sm"
            disabled={isDisabled}
            onClick={() => onSelect(option)}
            className={cn(
              "text-xs h-8",
              isDisabled && selectedOption !== option && "opacity-50"
            )}
          >
            {selectedOption === option && <Check className="h-3 w-3 mr-1" />}
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
});
