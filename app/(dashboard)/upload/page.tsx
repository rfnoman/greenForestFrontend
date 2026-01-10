"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  files?: File[];
  timestamp: Date;
}

export default function UploadPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      files: files.length > 0 ? [...files] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setFiles([]);
    setIsLoading(true);

    // TODO: Implement actual API call here
    // For now, just simulate a response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your upload. Your files have been received and are being processed.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <Card className="flex flex-1 flex-col">
        <CardHeader className="border-b">
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p>Upload your documents and send a message to get started.</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.files && message.files.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {message.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded bg-background/20 px-2 py-1 text-sm"
                          >
                            <FileIcon className="h-4 w-4" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
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
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or upload files..."
                className="min-h-[44px] flex-1 resize-none"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && files.length === 0)}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
