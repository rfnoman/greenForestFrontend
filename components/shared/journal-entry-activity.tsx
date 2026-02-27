"use client";

import { Bot, Cog, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/utils/format";
import type { ActorRef, ActorType, JournalEntryWithBusiness } from "@/lib/types";

function ActorDisplay({
  actorType,
  actor,
}: {
  actorType: ActorType | null;
  actor: ActorRef | null;
}) {
  if (actorType === "ai_agent") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 font-normal">
              <Bot className="h-3 w-3" />
              AI Agent
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {actor ? `on behalf of ${actor.full_name}` : "AI Agent"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (actorType === "system") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Cog className="h-3 w-3" />
        System
      </span>
    );
  }

  if (actor) {
    return <span>{actor.full_name}</span>;
  }

  return <span className="text-muted-foreground">Unknown</span>;
}

interface ActivityInfoProps {
  entry: JournalEntryWithBusiness;
  layout?: "inline" | "stacked";
}

export function ActivityInfo({ entry, layout = "stacked" }: ActivityInfoProps) {
  const items: React.ReactNode[] = [];

  // Created by
  items.push(
    <div key="created" className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground shrink-0">Created by:</span>
      <ActorDisplay
        actorType={entry.created_by_actor_type}
        actor={entry.created_by}
      />
    </div>
  );

  // Reviewed by (for ask_for_review, posted status)
  if (entry.reviewed_by && entry.reviewed_at) {
    items.push(
      <div key="reviewed" className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground shrink-0">
          {entry.status === "ask_for_review" ? "Sent for review by:" : "Reviewed by:"}
        </span>
        <span>{entry.reviewed_by.full_name}</span>
        <span className="text-muted-foreground">&middot;</span>
        <span className="text-muted-foreground">
          {formatDateTime(entry.reviewed_at)}
        </span>
      </div>
    );
  }

  // Posted by
  if (entry.posted_by && entry.posted_at) {
    items.push(
      <div key="posted" className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground shrink-0">Posted by:</span>
        <span>{entry.posted_by.full_name}</span>
        <span className="text-muted-foreground">&middot;</span>
        <span className="text-muted-foreground">
          {formatDateTime(entry.posted_at)}
        </span>
      </div>
    );
  }

  // Voided by
  if (entry.voided_by && entry.voided_at) {
    items.push(
      <div key="voided" className="flex items-center gap-1.5 text-xs text-destructive">
        <span className="shrink-0">Voided by:</span>
        <span>{entry.voided_by.full_name}</span>
        <span>&middot;</span>
        <span>{formatDateTime(entry.voided_at)}</span>
        {entry.void_reason && (
          <>
            <span>&middot;</span>
            <span className="italic">&ldquo;{entry.void_reason}&rdquo;</span>
          </>
        )}
      </div>
    );
  }

  if (layout === "inline") {
    return <div className="flex flex-wrap items-center gap-x-3 gap-y-1">{items}</div>;
  }

  return <div className="flex flex-col gap-1">{items}</div>;
}

/** Compact version for table cells - shows only the creator line */
export function ActivityBadge({ entry }: { entry: JournalEntryWithBusiness }) {
  return (
    <ActorDisplay
      actorType={entry.created_by_actor_type}
      actor={entry.created_by}
    />
  );
}
