"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface WebSocketMessage {
  type: string;
  message?: string;
  content?: string;
  session_id?: string;
  messages?: ChatMessage[];
  sessions?: ChatSession[];
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useChat(token: string | null, businessId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            break;

          case "message_received":
            if (data.session_id) {
              setSessionId(data.session_id);
            }
            currentResponseRef.current = "";
            break;

          case "response_start":
            setIsTyping(true);
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
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "list_sessions" }));
            }
            break;

          case "session_created":
            if (data.session_id) {
              setSessionId(data.session_id);
              setMessages([]);
            }
            break;

          case "session_loaded":
            if (data.messages) {
              setMessages(data.messages);
            }
            if (data.session_id) {
              setSessionId(data.session_id);
            }
            break;

          case "sessions_list":
            if (data.sessions) {
              setSessions(data.sessions);
            }
            break;

          case "error":
            setError(data.message || "An error occurred");
            setIsTyping(false);
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

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to chat server");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content }]);

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        message: content,
        session_id: sessionId,
      })
    );
  }, [sessionId]);

  const loadSession = useCallback((id: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

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
    wsRef.current.send(JSON.stringify({ type: "new_session" }));
  }, []);

  const listSessions = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: "list_sessions" }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    sessions,
    isConnected,
    isTyping,
    sessionId,
    error,
    sendMessage,
    loadSession,
    newSession,
    listSessions,
    clearError,
  };
}
