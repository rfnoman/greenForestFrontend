"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Send, Paperclip, X, FileIcon, Plus, MessageSquare, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/cn";
import { useChat } from "@/lib/hooks/use-chat";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatDistanceToNow } from "date-fns";

interface ChatInputProps {
  onSend: (message: string) => void;
  isConnected: boolean;
}

// Memoized input component to prevent re-renders when messages change
const ChatInput = memo(function ChatInput({ onSend, isConnected }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && files.length === 0) return;
    if (!isConnected || isSending) return;

    if (input.trim()) {
      setIsSending(true);
      onSend(input.trim());
      // Reset sending state after a short delay
      setTimeout(() => setIsSending(false), 500);
    }

    setInput("");
    setFiles([]);
  };

  return (
    <div className="border-t p-4">
      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm"
            >
              <FileIcon className="h-4 w-4" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected}
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
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isConnected}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!isConnected || isSending || (!input.trim() && files.length === 0)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MessagesAreaProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

// Memoized messages area
const MessagesArea = memo(function MessagesArea({ messages, isTyping }: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Upload your documents and send a message to get started.</p>
          </div>
        )}
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
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
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
  isConnected: boolean;
  onLoadSession: (id: string) => void;
  onNewSession: () => void;
}

// Memoized sessions sidebar
const SessionsSidebar = memo(function SessionsSidebar({
  sessions,
  sessionId,
  isConnected,
  onLoadSession,
  onNewSession,
}: SessionsSidebarProps) {
  return (
    <Card className="w-64 flex-shrink-0">
      <CardHeader className="border-b p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Chat History</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNewSession}
            disabled={!isConnected}
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-3.5rem)]">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No chat history
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
                <div className="flex-1 overflow-auto">
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
    sendMessage,
    loadSession,
    newSession,
    clearError,
  } = useChat(accessToken, currentBusiness?.id ?? null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-6">
      {/* Sessions Sidebar */}
      <SessionsSidebar
        sessions={sessions}
        sessionId={sessionId}
        isConnected={isConnected}
        onLoadSession={loadSession}
        onNewSession={newSession}
      />

      {/* Main Chat Area */}
      <Card className="flex flex-1 flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Upload Documents</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          {/* Error Banner */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Messages Area */}
          <MessagesArea messages={messages} isTyping={isTyping} />

          {/* Input Area */}
          <ChatInput
            onSend={sendMessage}
            isConnected={isConnected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
