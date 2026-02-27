"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  Paperclip,
  X,
  FileIcon,
  Plus,
  MessageSquare,
  WifiOff,
  Camera,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  PanelLeftOpen,
  PanelLeftClose,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { useChat } from "@/lib/hooks/use-chat";
import type { JournalEntrySummaryData, UserOptionsData } from "@/lib/hooks/use-chat";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatDistanceToNow } from "date-fns";
import { uploadChatFile } from "@/lib/api/chat-files";
import { CameraCapture } from "@/components/shared/camera-capture";
import { JournalEntryCard } from "@/components/chat/journal-entry-card";
import { UserOptionsButtons } from "@/components/chat/user-options-buttons";
import { MarkdownContent } from "@/components/chat/markdown-content";
import type { ChatAttachmentUploadResponse } from "@/lib/types";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "uploaded" | "error";
  uploadResponse?: ChatAttachmentUploadResponse;
  error?: string;
}

interface ChatInputProps {
  onSend: (message: string, fileIds?: string[], documentType?: string) => void;
  isConnected: boolean;
  isProcessing: boolean;
  sessionId: string | null;
}

const ChatInput = memo(function ChatInput({
  onSend,
  isConnected,
  isProcessing,
  sessionId,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [documentType, setDocumentType] = useState<"asset" | "liability" | "equity" | "revenue" | "expense">("expense");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      setUploadedFiles((prev) => [
        ...prev,
        { id: tempId, file, status: "uploading" },
      ]);

      try {
        const response = await uploadChatFile(file, sessionId ?? undefined);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? { ...f, id: response.id, status: "uploaded", uploadResponse: response }
              : f
          )
        );
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    },
    [sessionId]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          await handleFileUpload(file);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleCameraCapture = useCallback(
    (file: File) => {
      handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      const hasUploadedFiles = uploadedFiles.some((f) => f.status === "uploaded");
      if (!input.trim() && !hasUploadedFiles) return;
      if (!isConnected || isSending || isProcessing) return;

      setIsSending(true);

      const fileIds = uploadedFiles
        .filter((f) => f.status === "uploaded" && f.uploadResponse)
        .map((f) => f.uploadResponse!.id);

      const messageContent = input.trim() || "Process these files";
      onSend(messageContent, fileIds.length > 0 ? fileIds : undefined, documentType);

      setInput("");
      setUploadedFiles([]);
      setTimeout(() => setIsSending(false), 500);
    },
    [input, uploadedFiles, isConnected, isSending, isProcessing, onSend, documentType]
  );

  const hasUploadingFiles = uploadedFiles.some((f) => f.status === "uploading");
  const hasUploadedFiles = uploadedFiles.some((f) => f.status === "uploaded");
  const canSend = isConnected && !isSending && !isProcessing && !hasUploadingFiles && (input.trim() || hasUploadedFiles);

  return (
    <>
      <div className="px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-muted/30 shadow-sm transition-all focus-within:border-ring focus-within:shadow-md">
            {/* Uploaded files preview - inside the box */}
            {uploadedFiles.length > 0 && (
              <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className={cn(
                      "relative group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm border",
                      uploadedFile.status === "uploading" && "bg-muted border-border",
                      uploadedFile.status === "uploaded" && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
                      uploadedFile.status === "error" && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                    )}
                  >
                    {uploadedFile.status === "uploading" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                    {uploadedFile.status === "uploaded" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    )}
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewFile(uploadedFile.file)}
                      className="flex-shrink-0 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity"
                      title={uploadedFile.file.name}
                    >
                      {uploadedFile.file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(uploadedFile.file)}
                          alt={uploadedFile.file.name}
                          className="h-[52px] w-[52px] object-cover"
                        />
                      ) : (
                        <div className="h-[52px] w-[52px] flex items-center justify-center bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                    <span className="max-w-[120px] truncate text-xs">{uploadedFile.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(uploadedFile.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            <div className="px-4 pt-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  isConnected
                    ? hasUploadedFiles
                      ? "Add a message or press send to process files..."
                      : "Type a message or upload a receipt..."
                    : "Connecting..."
                }
                className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isConnected}
                rows={1}
              />
            </div>

            {/* Bottom toolbar - inside the box */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isConnected}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  disabled={!isConnected}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Open camera"
                >
                  <Camera className="h-4 w-4" />
                </button>

              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={documentType}
                  onValueChange={(value) => setDocumentType(value as "asset" | "liability" | "equity" | "revenue" | "expense")}
                >
                  <SelectTrigger
                    className={cn(
                      "h-7 w-auto gap-1.5 rounded-full px-3 text-xs font-semibold border focus:ring-0 focus:ring-offset-0 [&>svg]:h-3 [&>svg]:w-3",
                      documentType === "expense" && "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900",
                      documentType === "revenue" && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900",
                      documentType === "asset" && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900",
                      documentType === "liability" && "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900",
                      documentType === "equity" && "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900",
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      documentType === "expense" && "bg-red-500",
                      documentType === "revenue" && "bg-emerald-500",
                      documentType === "asset" && "bg-blue-500",
                      documentType === "liability" && "bg-orange-500",
                      documentType === "equity" && "bg-purple-500",
                    )} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!canSend}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg p-2 transition-all",
                    canSend
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  {isSending || hasUploadingFiles ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CameraCapture
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={handleCameraCapture}
      />

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
              {previewFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              ) : previewFile.type === "application/pdf" ? (
                <iframe
                  src={URL.createObjectURL(previewFile)}
                  title={previewFile.name}
                  className="w-full h-[65vh] rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <FileIcon className="h-12 w-12" />
                  <p className="text-sm">{previewFile.name}</p>
                  <p className="text-xs">Preview not available for this file type</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileIds?: string[];
  type?: "text" | "tool_progress" | "journal_entry" | "user_options";
  data?: JournalEntrySummaryData | UserOptionsData;
  selectedOption?: string;
}

interface MessagesAreaProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isProcessingFiles: boolean;
  isLoading: boolean;
  onSelectOption?: (messageIndex: number, option: string) => void;
}

const MessagesArea = memo(function MessagesArea({
  messages,
  isTyping,
  isProcessingFiles,
  isLoading,
  onSelectOption,
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isProcessingFiles]);

  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl bg-primary/10 px-4 py-3 animate-pulse">
              <div className="h-4 w-48 bg-muted-foreground/20 rounded" />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[75%]">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="rounded-2xl bg-muted px-4 py-3 space-y-2 animate-pulse">
                <div className="h-4 w-64 bg-muted-foreground/20 rounded" />
                <div className="h-4 w-56 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl bg-primary/10 px-4 py-3 animate-pulse">
              <div className="h-4 w-40 bg-muted-foreground/20 rounded" />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[75%]">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="rounded-2xl bg-muted px-4 py-3 space-y-2 animate-pulse">
                <div className="h-4 w-52 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (messages.length === 0 && !isTyping && !isProcessingFiles) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 w-fit">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Bookkeeper Agent</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Upload receipts or type a message to start recording expenses and income
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        {messages
          .filter((message) => message.content.trim() !== "" || message.type === "journal_entry" || message.type === "user_options")
          .map((message, index) => {
            // Tool progress messages: smaller, muted inline items
            if (message.type === "tool_progress") {
              return (
                <div key={index} className="flex justify-start">
                  <div className="flex gap-3 max-w-[75%]">
                    <div className="w-8 flex-shrink-0" />
                    <div className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      <MarkdownContent content={message.content} />
                    </div>
                  </div>
                </div>
              );
            }

            // Journal entry summary card
            if (message.type === "journal_entry" && message.data) {
              return (
                <div key={index} className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <JournalEntryCard data={message.data as JournalEntrySummaryData} />
                  </div>
                </div>
              );
            }

            // User options buttons
            if (message.type === "user_options" && message.data) {
              const optionsData = message.data as UserOptionsData;
              const realIndex = messages.indexOf(message);
              return (
                <div key={index} className="flex justify-start">
                  <div className="flex gap-3 max-w-[75%]">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                      <UserOptionsButtons
                        data={optionsData}
                        selectedOption={message.selectedOption}
                        onSelect={(option) => onSelectOption?.(realIndex, option)}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // User message (unchanged)
            if (message.role === "user") {
              return (
                <div key={index} className={cn("flex", "justify-end")}>
                  <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-4 py-3">
                    {message.fileIds && message.fileIds.length > 0 && (
                      <div className="flex items-center gap-1 mb-1.5 text-xs opacity-70">
                        <Paperclip className="h-3 w-3" />
                        <span>{message.fileIds.length} file(s) attached</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              );
            }

            // Standard assistant text message with markdown
            return (
              <div key={index} className={cn("flex", "justify-start")}>
                <div className="flex gap-3 max-w-[75%]">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                    {message.fileIds && message.fileIds.length > 0 && (
                      <div className="flex items-center gap-1 mb-1.5 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>{message.fileIds.length} file(s) attached</span>
                      </div>
                    )}
                    <div className="text-sm leading-relaxed">
                      <MarkdownContent content={message.content} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {(isProcessingFiles || (isTyping && messages[messages.length - 1]?.content.trim() === "")) && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[75%]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                {isProcessingFiles ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing uploaded files...</span>
                  </div>
                ) : (
                  <div className="flex space-x-1.5 py-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.3s]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
});

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface SessionsSidebarProps {
  sessions: ChatSession[];
  sessionId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onLoadSession: (id: string) => void;
}

const SessionsSidebar = memo(function SessionsSidebar({
  sessions,
  sessionId,
  isOpen,
  onToggle,
  onLoadSession,
}: SessionsSidebarProps) {
  return (
    <div className={cn(
      "flex-shrink-0 transition-all duration-300 ease-in-out",
      isOpen ? "w-72" : "w-0"
    )}>
      <div className={cn(
        "h-full flex-col overflow-hidden transition-all duration-300 border-r bg-muted/30",
        isOpen ? "flex w-72" : "hidden"
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-medium">History</span>
          <button
            onClick={onToggle}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close History"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No history yet
              </p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onLoadSession(session.id)}
                  className={cn(
                    "w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    sessionId === session.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium text-[13px]">{session.title || "New Chat"}</p>
                    <p
                      className={cn(
                        "text-xs mt-0.5",
                        sessionId === session.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

export default function UploadExpensePage() {
  const { accessToken } = useAuth();
  const { currentBusiness } = useBusiness();
  const {
    messages,
    sessions,
    isConnected,
    isTyping,
    sessionId,
    error,
    isProcessingFiles,
    isLoading,
    sendMessage,
    loadSession,
    newSession,
    clearError,
    selectOption,
  } = useChat(accessToken, currentBusiness?.id ?? null);

  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleNewSession = useCallback(() => {
    newSession();
  }, [newSession]);

  const handleLoadSession = useCallback(
    (id: string) => {
      loadSession(id);
    },
    [loadSession]
  );

  const toggleHistory = useCallback(() => {
    setHistoryOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sessions Sidebar */}
      <SessionsSidebar
        sessions={sessions}
        sessionId={sessionId}
        isOpen={historyOpen}
        onToggle={toggleHistory}
        onLoadSession={handleLoadSession}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            {!historyOpen && (
              <button
                onClick={toggleHistory}
                className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Open History"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-none">Bookkeeper Agent</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  {isConnected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[11px] text-muted-foreground">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-destructive" />
                      <span className="text-[11px] text-destructive">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSession}
            disabled={!isConnected}
            className="rounded-lg h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Messages */}
        <MessagesArea
          messages={messages}
          isTyping={isTyping}
          isProcessingFiles={isProcessingFiles}
          isLoading={isLoading}
          onSelectOption={selectOption}
        />

        {/* Chat Input */}
        <ChatInput
          onSend={sendMessage}
          isConnected={isConnected}
          isProcessing={isTyping || isProcessingFiles}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}
