import { useCallback, useEffect, useRef, useState } from "react";
import { type Commentary, type Match, serverMessageSchema } from "../../types";
import { createSocket } from "../../lib/ws";
import { fetchMatches } from "../../lib/api";

export function useMatchSocket() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [connected, setConnected] = useState(false);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [subscribedMatches, setSubscribedMatches] = useState<Set<number>>(
    new Set(),
  );
  const socketRef = useRef<WebSocket | null>(null);

  const subscribe = useCallback((matchId: number) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", matchId }));
    }
  }, []);

  const unsubscribe = useCallback((matchId: number) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "unsubscribe", matchId }));
    }
  }, []);

  useEffect(() => {
    fetchMatches().then((r) => setMatches(r.data)).catch(console.error);
    
    const ws = createSocket();
    socketRef.current = ws;


    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      let json: unknown;

      try {
        json = JSON.parse(e.data);
      } catch {
        console.error("Invalid JSON from server:", e.data);
        return;
      }
      const result = serverMessageSchema.safeParse(json);

      if (!result.success) {
        console.error("Invalid WS message:", result.error.issues);
        return;
      }

      const msg = result.data;

      switch (msg.type) {
        case "welcome":
          console.log("Connected to WS");
          break;

        case "subscribed":
        case "already_subscribed":
          setSubscribedMatches((prev) => new Set(prev).add(msg.matchId));
          break;

        case "unsubscribed":
        case "not_subscribed":
          setSubscribedMatches((prev) => {
            const next = new Set(prev);
            next.delete(msg.matchId);
            return next;
          });
          break;

        case "commentary":
          setCommentary((prev) => [...prev, msg.data]);
          break;

        case "match_created":
          setMatches((prev) => [...prev, msg.data]);
          break;

        case "error":
          console.error("Server error:", msg.message);
          break;
      }
    };

    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onmessage = null;
      ws.close();
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
    };
  }, []);

  return {
    connected,
    commentary,
    subscribedMatches,
    matches,
    subscribe,
    unsubscribe,
  };
}
