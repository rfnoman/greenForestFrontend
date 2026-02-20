"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ExtractedReceiptData } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileIds?: string[];
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
  messages?: ChatMessage[];
  sessions?: ChatSession[];
  file_ids?: string[];
  file_id?: string;
  count?: number;
  extracted_data?: ExtractedReceiptData;
  error?: string;
  tools_enabled?: boolean;
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

          case "response_end":
            setIsTyping(false);
            setIsProcessingFiles(false);
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "list_sessions" }));
            }
            break;

          case "session_created":
            if (data.session_id) {
              setSessionId(data.session_id);
              setMessages([]);
              setProcessingFiles([]);
            }
            break;

          case "session_loaded":
            if (data.messages) {
              setMessages(data.messages);
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
  };
}
