"use client";

import { useState } from "react";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ClipboardCheck,
  MessageSquare,
  ImageIcon,
  ExternalLink,
  X,
  User,
  Bot,
  Pencil,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supervisorApi } from "@/lib/api/supervisor";
import type { JournalEntryWithBusiness } from "@/lib/types";
import { ActivityInfo } from "@/components/shared/journal-entry-activity";

interface JournalEntryQuickViewProps {
  entry: JournalEntryWithBusiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPost: () => void;
  onAskForReview?: () => void;
  onEdit?: () => void;
}

export function JournalEntryQuickView({
  entry,
  open,
  onOpenChange,
  onPost,
  onAskForReview,
  onEdit,
}: JournalEntryQuickViewProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  // Fetch chat session messages when conversation dialog is open
  const { data: chatSession, isLoading: isLoadingChat } = useQuery({
    queryKey: ["chat-session", entry.chat_session?.id],
    queryFn: () =>
      supervisorApi.getChatSession(entry.chat_session!.id, entry.business_id),
    enabled: !!entry.chat_session && showConversation,
  });

  // Fetch chat attachments when chat_session exists
  const { data: chatFiles, isLoading: isLoadingFiles } = useQuery({
    queryKey: ["chat-files", entry.chat_session?.id],
    queryFn: () =>
      supervisorApi.getChatFiles(entry.chat_session!.id, entry.business_id),
    enabled: !!entry.chat_session && open,
  });

  // Filter to only image attachments
  const imageFiles = chatFiles?.filter((file) =>
    file.mime_type.startsWith("image/")
  );

  // Calculate totals
  const totalDebit = entry.lines.reduce(
    (sum, line) => sum + parseFloat(line.debit || "0"),
    0
  );
  const totalCredit = entry.lines.reduce(
    (sum, line) => sum + parseFloat(line.credit || "0"),
    0
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Journal Entry: {entry.entry_number}
              <Badge variant="outline">
                {entry.status === "ask_for_review" ? "Ask for Review" : entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
              </Badge>
            </SheetTitle>
            <SheetDescription>
              Review the details of this journal entry
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Entry Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Entry Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-medium">{formatDate(entry.entry_date)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Entry Number:</span>
                  <div className="font-medium">{entry.entry_number}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Description:</span>
                  <div className="font-medium">{entry.description || "—"}</div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Business Information</h4>
              <div className="text-sm">
                <span className="text-muted-foreground">Business:</span>
                <div className="font-medium">{entry.business_name}</div>
              </div>
            </div>

            {/* Activity / Actions By */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Activity</h4>
              <ActivityInfo entry={entry} />
            </div>

            {/* Chat Session / Source Context */}
            {entry.chat_session && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Source</h4>
                <div className="space-y-3">
                  {/* Conversation Link */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Chat Session:</span>
                      <span className="font-medium">
                        {entry.chat_session.title || "Untitled Session"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConversation(true)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      View Conversation
                    </Button>
                  </div>

                  {/* Attached Images */}
                  {isLoadingFiles && (
                    <div className="flex gap-2">
                      <Skeleton className="h-20 w-20 rounded-md" />
                      <Skeleton className="h-20 w-20 rounded-md" />
                    </div>
                  )}
                  {imageFiles && imageFiles.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Attached Images ({imageFiles.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {imageFiles.map((file) => {
                          const url = supervisorApi.getChatFileDownloadUrl(
                            file.id,
                            entry.business_id
                          );
                          return (
                            <button
                              key={file.id}
                              onClick={() => setPreviewImage(url)}
                              className="relative group rounded-md overflow-hidden border hover:border-primary transition-colors"
                            >
                              <img
                                src={url}
                                alt={file.original_filename}
                                className="h-20 w-20 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {chatFiles && chatFiles.length > 0 && (!imageFiles || imageFiles.length === 0) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span>{chatFiles.length} file(s) attached (no images)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Line Items */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Line Items</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{line.account_name}</div>
                            <div className="text-muted-foreground">
                              {line.account_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {line.description || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {line.debit && parseFloat(line.debit) > 0
                            ? formatCurrency(parseFloat(line.debit), "USD")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {line.credit && parseFloat(line.credit) > 0
                            ? formatCurrency(parseFloat(line.credit), "USD")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-semibold">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totalDebit, "USD")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totalCredit, "USD")}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>

            {/* Contact Information (if available) */}
            {entry.contact && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Contact</h4>
                <div className="text-sm">
                  <div className="font-medium">{entry.contact.name}</div>
                  <Badge variant="secondary" className="mt-1">
                    {entry.contact.type}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEdit && (entry.status === "draft" || entry.status === "ask_for_review") && (
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onAskForReview && entry.status === "draft" && (
              <Button variant="outline" onClick={onAskForReview}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Ask for Review
              </Button>
            )}
            <Button onClick={onPost}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Post Entry
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Attachment Preview</DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {previewImage && (
              <img
                src={previewImage}
                alt="Attachment preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversation History Dialog */}
      <Dialog open={showConversation} onOpenChange={setShowConversation}>
        <DialogContent className="max-w-2xl p-0 h-[80vh] flex flex-col">
          <div className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat History
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {entry.chat_session?.title || "Untitled Session"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {isLoadingChat ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chatSession?.messages && chatSession.messages.length > 0 ? (
              <div className="space-y-4 pb-2">
                {chatSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "" : ""
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {message.role === "user" ? "Owner" : "AI Assistant"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words bg-muted/50 rounded-lg px-3 py-2">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-sm">No messages found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
