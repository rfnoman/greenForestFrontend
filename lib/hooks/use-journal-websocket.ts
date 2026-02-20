"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface JournalEntryLine {
  account_code: string;
  account_name: string;
  debit: string;
  credit: string;
}

export interface JournalFeedEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  status: string;
  source_type: string;
  business_name: string;
  contact_name: string | null;
  lines: JournalEntryLine[];
  created_by: string | null;
  created_at: string;
}

interface WSMessage {
  type: "connection_established" | "journal_entry_posted";
  message?: string;
  entry?: JournalFeedEntry;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "access_denied";

const MAX_ENTRIES = 100;
const MAX_BACKOFF_MS = 30000;

export function useJournalWebSocket(accessToken: string | null) {
  const [entries, setEntries] = useState<JournalFeedEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!accessToken || unmountedRef.current) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const url = `${wsUrl}/ws/journal-feed/?token=${accessToken}`;

    setStatus("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close();
        return;
      }
      backoffRef.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);

        if (data.type === "connection_established") {
          setStatus("connected");
        } else if (data.type === "journal_entry_posted" && data.entry) {
          setEntries((prev) => {
            const updated = [data.entry!, ...prev];
            return updated.slice(0, MAX_ENTRIES);
          });
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      if (unmountedRef.current) return;

      if (event.code === 4003) {
        setStatus("access_denied");
        return;
      }

      setStatus("disconnected");
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror, handling reconnection there
    };
  }, [accessToken]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnectTimer]);

  return { entries, status };
}
