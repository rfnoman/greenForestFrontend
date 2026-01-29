"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  Send,
  Paperclip,
  X,
  FileIcon,
  Plus,
  MessageSquare,
  WifiOff,
  Camera,
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Upload,
  ArrowRight,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { useChat } from "@/lib/hooks/use-chat";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatDistanceToNow } from "date-fns";
import { uploadChatFile } from "@/lib/api/chat-files";
import { CameraCapture } from "@/components/shared/camera-capture";
import type { ChatAttachmentUploadResponse } from "@/lib/types";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "uploaded" | "error";
  uploadResponse?: ChatAttachmentUploadResponse;
  error?: string;
}

type TransactionType = "income" | "expense";
type PaymentMethod = "cash" | "bank" | "card";

// Initial Form Component
interface InitialFormProps {
  onSubmit: (data: {
    fileIds: string[];
    type: TransactionType;
    method: PaymentMethod;
    purpose: string;
    amount?: string;
  }) => void;
  isConnected: boolean;
  sessionId: string | null;
}

const InitialForm = memo(function InitialForm({
  onSubmit,
  isConnected,
  sessionId,
}: InitialFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset payment method when transaction type changes
  useEffect(() => {
    setPaymentMethod("");
  }, [transactionType]);

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

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const uploadedFileIds = uploadedFiles
        .filter((f) => f.status === "uploaded" && f.uploadResponse)
        .map((f) => f.uploadResponse!.id);

      // If no files uploaded, amount is required
      if (uploadedFileIds.length === 0 && !amount.trim()) {
        return;
      }

      if (!transactionType || !paymentMethod || !purpose.trim()) {
        return;
      }

      setIsSubmitting(true);
      onSubmit({
        fileIds: uploadedFileIds,
        type: transactionType,
        method: paymentMethod,
        purpose: purpose.trim(),
        amount: amount.trim() || undefined,
      });
    },
    [uploadedFiles, transactionType, paymentMethod, purpose, amount, onSubmit]
  );

  const hasUploadingFiles = uploadedFiles.some((f) => f.status === "uploading");
  const hasUploadedFiles = uploadedFiles.some((f) => f.status === "uploaded");
  // Amount is required only if no files are uploaded
  const isAmountRequired = !hasUploadedFiles;
  const isAmountValid = !isAmountRequired || amount.trim();
  const canSubmit =
    isConnected &&
    !isSubmitting &&
    !hasUploadingFiles &&
    transactionType &&
    paymentMethod &&
    purpose.trim() &&
    isAmountValid;

  const getPaymentMethodOptions = () => {
    if (transactionType === "income") {
      return [
        { value: "cash", label: "Received by Cash" },
        { value: "bank", label: "Received by Bank" },
      ];
    }
    if (transactionType === "expense") {
      return [
        { value: "cash", label: "Paid with Cash" },
        { value: "card", label: "Paid with Card" },
      ];
    }
    return [];
  };

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-6">
          <div className="text-center mb-6">
            <div className="mx-auto rounded-full bg-muted p-4 mb-2 w-fit">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">Accounting Assistant</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a receipt to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
          {/* Upload Area */}
          <div className="space-y-2">
            <Label>Receipt / Document</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                uploadedFiles.length > 0 ? "border-muted" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              {uploadedFiles.length === 0 ? (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to upload
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isConnected}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCameraModal(true)}
                      disabled={!isConnected}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((uploadedFile) => (
                    <div
                      key={uploadedFile.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm",
                        uploadedFile.status === "uploading" && "bg-muted",
                        uploadedFile.status === "uploaded" && "bg-green-50 dark:bg-green-950",
                        uploadedFile.status === "error" && "bg-red-50 dark:bg-red-950"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {uploadedFile.status === "uploading" && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                        )}
                        {uploadedFile.status === "uploaded" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                        {uploadedFile.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        {getFileIcon(uploadedFile.file)}
                        <span className="truncate">{uploadedFile.file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(uploadedFile.id)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isConnected}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add more
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount
              {isAmountRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isAmountRequired ? "Required when no receipt uploaded" : "Optional if receipt uploaded"}
            />
            {!hasUploadedFiles && (
              <p className="text-xs text-muted-foreground">
                Amount is required when no receipt is uploaded
              </p>
            )}
          </div>

          {/* Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as TransactionType)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              disabled={!transactionType}
            >
              <SelectTrigger id="method">
                <SelectValue placeholder={transactionType ? "Select method" : "Select type first"} />
              </SelectTrigger>
              <SelectContent>
                {getPaymentMethodOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purpose Field */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Office supplies, Client payment"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Continue
          </Button>
        </form>
        </div>
      </ScrollArea>

      {/* Camera Modal */}
      <CameraCapture
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={handleCameraCapture}
      />
    </>
  );
});

interface ChatInputProps {
  onSend: (message: string, fileIds?: string[]) => void;
  isConnected: boolean;
  isProcessing: boolean;
  sessionId: string | null;
}

// Memoized input component for chat
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onSend(messageContent, fileIds.length > 0 ? fileIds : undefined);

      setInput("");
      setUploadedFiles([]);
      setTimeout(() => setIsSending(false), 500);
    },
    [input, uploadedFiles, isConnected, isSending, isProcessing, onSend]
  );

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const hasUploadingFiles = uploadedFiles.some((f) => f.status === "uploading");
  const hasUploadedFiles = uploadedFiles.some((f) => f.status === "uploaded");
  const canSend = isConnected && !isSending && !isProcessing && !hasUploadingFiles && (input.trim() || hasUploadedFiles);

  return (
    <>
      <div className="border-t p-4">
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                  uploadedFile.status === "uploading" && "bg-muted",
                  uploadedFile.status === "uploaded" && "bg-green-50 dark:bg-green-950",
                  uploadedFile.status === "error" && "bg-red-50 dark:bg-red-950"
                )}
              >
                {uploadedFile.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {uploadedFile.status === "uploaded" && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {uploadedFile.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                {getFileIcon(uploadedFile.file)}
                <span className="max-w-[150px] truncate">{uploadedFile.file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowCameraModal(true)}
            disabled={!isConnected}
            title="Open camera"
          >
            <Camera className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <input
            type="text"
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
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isConnected}
          />
          <Button type="submit" size="icon" disabled={!canSend}>
            {isSending || hasUploadingFiles ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      <CameraCapture
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={handleCameraCapture}
      />
    </>
  );
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileIds?: string[];
}

interface MessagesAreaProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isProcessingFiles: boolean;
}

const MessagesArea = memo(function MessagesArea({
  messages,
  isTyping,
  isProcessingFiles,
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isProcessingFiles]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.fileIds && message.fileIds.length > 0 && (
                <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                  <Paperclip className="h-3 w-3" />
                  <span>{message.fileIds.length} file(s) attached</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isProcessingFiles && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing uploaded files...</span>
              </div>
            </div>
          </div>
        )}

        {isTyping && !isProcessingFiles && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
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
      isOpen ? "w-64" : "w-0"
    )}>
      <Card className={cn(
        "h-full flex-col overflow-hidden transition-all duration-300 rounded-none border-0 border-l",
        isOpen ? "flex w-64" : "hidden"
      )}>
        <CardHeader className="border-b p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">History</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
              title="Close History"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No history yet
              </p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onLoadSession(session.id)}
                  className={cn(
                    "w-full flex items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    sessionId === session.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium">{session.title || "New Chat"}</p>
                    <p
                      className={cn(
                        "text-xs",
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
      </Card>
    </div>
  );
});

export default function UploadPage() {
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
    sendMessage,
    loadSession,
    newSession,
    clearError,
  } = useChat(accessToken, currentBusiness?.id ?? null);

  const [showChat, setShowChat] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Show chat view only when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowChat(true);
    }
  }, [messages]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInitialSubmit = useCallback(
    (data: {
      fileIds: string[];
      type: TransactionType;
      method: PaymentMethod;
      purpose: string;
      amount?: string;
    }) => {
      // Build the message based on form data
      const typeLabel = data.type === "income" ? "Income" : "Expense";
      let methodLabel = "";
      if (data.type === "income") {
        methodLabel = data.method === "cash" ? "received by cash" : "received by bank";
      } else {
        methodLabel = data.method === "cash" ? "paid with cash" : "paid with card";
      }

      const hasFiles = data.fileIds.length > 0;
      const amountPart = data.amount ? ` Amount: $${data.amount}.` : "";

      let message: string;
      if (hasFiles) {
        message = `Process this ${typeLabel.toLowerCase()} receipt. ${typeLabel} ${methodLabel}. Purpose: ${data.purpose}.${amountPart}`;
      } else {
        message = `Create a ${typeLabel.toLowerCase()} entry. ${typeLabel} ${methodLabel}. Purpose: ${data.purpose}.${amountPart}`;
      }

      sendMessage(message, hasFiles ? data.fileIds : undefined);
      setShowChat(true);
    },
    [sendMessage]
  );

  const handleNewSession = useCallback(() => {
    newSession();
    setShowChat(false);
  }, [newSession]);

  const handleLoadSession = useCallback(
    (id: string) => {
      loadSession(id);
      setShowChat(true);
    },
    [loadSession]
  );

  const toggleHistory = useCallback(() => {
    setHistoryOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Area */}
      <Card className="flex flex-1 flex-col rounded-none border-0 border-r">
        {showChat ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Accounting Assistant</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload receipts, create journal entries, and get help with accounting
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isConnected && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <WifiOff className="h-4 w-4" />
                      <span>Disconnected</span>
                    </div>
                  )}
                  {isConnected && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                      <span>Connected</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewSession}
                    disabled={!isConnected}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  {!historyOpen && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleHistory}
                      title="Open History"
                    >
                      <PanelRightOpen className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0 overflow-hidden">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={clearError} className="hover:opacity-70">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <MessagesArea
                messages={messages}
                isTyping={isTyping}
                isProcessingFiles={isProcessingFiles}
              />

              <ChatInput
                onSend={sendMessage}
                isConnected={isConnected}
                isProcessing={isTyping || isProcessingFiles}
                sessionId={sessionId}
              />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="border-b py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isConnected && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <WifiOff className="h-4 w-4" />
                      <span>Disconnected</span>
                    </div>
                  )}
                  {isConnected && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                      <span>Connected</span>
                    </div>
                  )}
                </div>
                {!historyOpen && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleHistory}
                    title="Open History"
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0 overflow-hidden">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={clearError} className="hover:opacity-70">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <InitialForm
                onSubmit={handleInitialSubmit}
                isConnected={isConnected}
                sessionId={sessionId}
              />
            </CardContent>
          </>
        )}
      </Card>

      {/* Sessions Sidebar - Right Side */}
      <SessionsSidebar
        sessions={sessions}
        sessionId={sessionId}
        isOpen={historyOpen}
        onToggle={toggleHistory}
        onLoadSession={handleLoadSession}
      />
    </div>
  );
}
