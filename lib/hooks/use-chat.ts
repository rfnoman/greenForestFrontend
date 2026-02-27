"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ExtractedReceiptData } from "@/lib/types";

export type ChatMessageType = "text" | "tool_progress" | "journal_entry" | "user_options";

export interface JournalEntrySummaryData {
  id?: string;
  entry_number: string;
  status: string;
  entry_date: string;
  description: string | null;
  contact: {
    id: string;
    name: string;
    type: string;
  } | null;
  lines: {
    account_code: string;
    account_name: string;
    description?: string | null;
    debit: string;
    credit: string;
  }[];
}

export interface UserOptionsData {
  question: string;
  options: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileIds?: string[];
  type?: ChatMessageType;
  data?: JournalEntrySummaryData | UserOptionsData;
  selectedOption?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface FileProcessingResult {
  fileId: string;
  status: "processing" | "completed" | "error";
  extractedData?: ExtractedReceiptData;
  error?: string;
}

interface WebSocketMessage {
  type: string;
  message?: string;
  content?: string;
  session_id?: string;
  title?: string;
  messages?: Array<{
    role: "user" | "assistant";
    content: string;
    file_ids?: string[];
    fileIds?: string[];
    type?: ChatMessageType;
    data?: JournalEntrySummaryData | UserOptionsData;
    selected_option?: string;
  }>;
  sessions?: ChatSession[];
  file_ids?: string[];
  file_id?: string;
  count?: number;
  extracted_data?: ExtractedReceiptData;
  error?: string;
  tools_enabled?: boolean;
  data?: JournalEntrySummaryData | UserOptionsData | Record<string, unknown>;
  question?: string;
  options?: string[];
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useChat(token: string | null, businessId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingFiles, setProcessingFiles] = useState<FileProcessingResult[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const currentResponseRef = useRef("");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const tokenRef = useRef(token);
  const businessIdRef = useRef(businessId);

  const maxReconnectAttempts = 5;

  // Keep refs updated
  tokenRef.current = token;
  businessIdRef.current = businessId;

  useEffect(() => {
    isMountedRef.current = true;

    const connect = () => {
      // Don't connect if no token, no business, already connecting, or unmounted
      if (!tokenRef.current || !businessIdRef.current || isConnectingRef.current || !isMountedRef.current) {
        return;
      }

      // Don't reconnect if already connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      isConnectingRef.current = true;

      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect loop
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/?token=${tokenRef.current}&business_id=${businessIdRef.current}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        isConnectingRef.current = false;
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        // Load sessions on connect
        ws.send(JSON.stringify({ type: "list_sessions" }));
        setIsLoading(false);
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;

        if (!isMountedRef.current) return;

        setIsConnected(false);

        if (event.code === 4001) {
          setError("Authentication failed. Please login again.");
          return;
        }

        // Only reconnect if component is still mounted and we have a token
        if (isMountedRef.current && tokenRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Connection lost. Please refresh the page.");
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        const data: WebSocketMessage = JSON.parse(event.data);

        switch (data.type) {
          case "connection_established":
            // Connection successful, tools_enabled indicates if AI tools are available
            break;

          case "message_received":
            if (data.session_id) {
              setSessionId(data.session_id);
            }
            currentResponseRef.current = "";
            break;

          case "processing_files":
            // Server is processing uploaded files
            setIsProcessingFiles(true);
            break;

          case "file_processed":
            // A file has been processed successfully
            if (data.file_id) {
              setProcessingFiles((prev) => {
                const existing = prev.find((f) => f.fileId === data.file_id);
                if (existing) {
                  return prev.map((f) =>
                    f.fileId === data.file_id
                      ? { ...f, status: "completed" as const, extractedData: data.extracted_data }
                      : f
                  );
                }
                return [
                  ...prev,
                  {
                    fileId: data.file_id!,
                    status: "completed" as const,
                    extractedData: data.extracted_data,
                  },
                ];
              });
            }
            break;

          case "file_processing_error":
            // A file failed to process
            if (data.file_id) {
              setProcessingFiles((prev) => {
                const existing = prev.find((f) => f.fileId === data.file_id);
                if (existing) {
                  return prev.map((f) =>
                    f.fileId === data.file_id
                      ? { ...f, status: "error" as const, error: data.error }
                      : f
                  );
                }
                return [
                  ...prev,
                  {
                    fileId: data.file_id!,
                    status: "error" as const,
                    error: data.error,
                  },
                ];
              });
            }
            break;

          case "response_start":
            setIsTyping(true);
            setIsProcessingFiles(false);
            currentResponseRef.current = "";
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            break;

          case "response_chunk":
            if (data.content) {
              currentResponseRef.current += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: currentResponseRef.current };
                }
                return updated;
              });
            }
            break;

          case "response_end": {
            setIsTyping(false);
            setIsProcessingFiles(false);
            // Reclassify the last message as tool_progress if it starts with emoji prefixes
            const toolProgressEmojis = ["🔍", "✅", "❌", "📂", "📝", "⚠️", "🔄", "💾"];
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === "assistant" && !updated[lastIdx].type) {
                const content = updated[lastIdx].content.trim();
                const isToolProgress = toolProgressEmojis.some((emoji) => content.startsWith(emoji));
                if (isToolProgress) {
                  updated[lastIdx] = { ...updated[lastIdx], type: "tool_progress" };
                } else {
                  updated[lastIdx] = { ...updated[lastIdx], type: "text" };
                }
              }
              return updated;
            });
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "list_sessions" }));
            }
            break;
          }

          case "journal_entry_summary": {
            const jeData = (data.data || data) as Record<string, unknown>;
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "",
                type: "journal_entry",
                data: {
                  id: jeData.id as string | undefined,
                  entry_number: jeData.entry_number as string,
                  status: jeData.status as string,
                  entry_date: jeData.entry_date as string,
                  description: (jeData.description as string) || null,
                  contact: (jeData.contact as JournalEntrySummaryData["contact"]) || null,
                  lines: (jeData.lines as JournalEntrySummaryData["lines"]) || [],
                } as JournalEntrySummaryData,
              },
            ]);
            break;
          }

          case "user_options": {
            const uoData = (data.data || data) as Record<string, unknown>;
            const question = (uoData.question as string) || "";
            const options = (uoData.options as string[]) || [];
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: question,
                type: "user_options",
                data: { question, options } as UserOptionsData,
              },
            ]);
            break;
          }

          case "session_created":
            if (data.session_id) {
              setSessionId(data.session_id);
              setMessages([]);
              setProcessingFiles([]);
            }
            break;

          case "session_loaded":
            if (data.messages) {
              setMessages(data.messages.map((msg) => ({
                role: msg.role,
                content: msg.content || "",
                fileIds: msg.file_ids || msg.fileIds,
                type: msg.type || "text",
                data: msg.data,
                selectedOption: msg.selected_option,
              })));
            }
            if (data.session_id) {
              setSessionId(data.session_id);
            }
            setProcessingFiles([]);
            setIsLoading(false);
            break;

          case "sessions_list":
            if (data.sessions) {
              setSessions(data.sessions);
            }
            break;

          case "session_title_updated":
            // Update the title of a specific session
            if (data.session_id && data.title) {
              setSessions((prev) =>
                prev.map((session) =>
                  session.id === data.session_id
                    ? { ...session, title: data.title! }
                    : session
                )
              );
            }
            break;

          case "error":
            setError(data.message || "An error occurred");
            setIsTyping(false);
            setIsProcessingFiles(false);
            break;
        }
      };
    };

    // Initial connection
    if (token && businessId) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      isConnectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on cleanup
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, businessId]);

  const sendMessage = useCallback((content: string, fileIds?: string[], documentType?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to chat server");
      return;
    }

    // Add user message with optional file references
    setMessages((prev) => [...prev, { role: "user", content, fileIds }]);

    // Determine message type based on whether files are included
    const messageType = fileIds && fileIds.length > 0 ? "chat_with_files" : "chat";

    // Initialize processing state for files
    if (fileIds && fileIds.length > 0) {
      setProcessingFiles(
        fileIds.map((id) => ({ fileId: id, status: "processing" as const }))
      );
    }

    wsRef.current.send(
      JSON.stringify({
        type: messageType,
        message: content,
        ...(fileIds && fileIds.length > 0 && { file_ids: fileIds }),
        ...(documentType && { document_type: documentType }),
        session_id: sessionId,
      })
    );
  }, [sessionId]);

  const loadSession = useCallback((id: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setIsLoading(true);
    setMessages([]); // Clear messages before loading new session
    setSessionId(id);
    wsRef.current.send(
      JSON.stringify({
        type: "load_session",
        session_id: id,
      })
    );
  }, []);

  const newSession = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setMessages([]);
    setSessionId(null);
    setProcessingFiles([]);
    wsRef.current.send(JSON.stringify({ type: "new_session" }));
  }, []);

  const listSessions = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: "list_sessions" }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearProcessingFiles = useCallback(() => {
    setProcessingFiles([]);
  }, []);

  const selectOption = useCallback((messageIndex: number, option: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]?.type === "user_options") {
        updated[messageIndex] = { ...updated[messageIndex], selectedOption: option };
      }
      return updated;
    });
    // Send the selected option as a regular chat message
    sendMessage(option);
  }, [sendMessage]);

  return {
    messages,
    sessions,
    isConnected,
    isTyping,
    sessionId,
    error,
    processingFiles,
    isProcessingFiles,
    isLoading,
    sendMessage,
    loadSession,
    newSession,
    listSessions,
    clearError,
    clearProcessingFiles,
    selectOption,
  };
}
