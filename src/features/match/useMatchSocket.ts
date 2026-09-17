import { useCallback, useEffect, useRef, useState } from "react";
import { type Commentary, type Match, serverMessageSchema } from "../../types";
import { createSocket } from "../../lib/ws";
import { fetchMatchCommentary, fetchMatches } from "../../lib/api";

export function useMatchSocket() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [connected, setConnected] = useState(false);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [subscribedMatches, setSubscribedMatches] = useState<Set<number>>(
    new Set(),
  );
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const activeMatchIdRef = useRef<number | null>(null);
  const desiredSubscriptions = useRef(new Set<number>());

  const subscribe = useCallback((matchId: number) => {
    desiredSubscriptions.current.add(matchId);
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socketRef.current?.send(JSON.stringify({ type: "subscribe", matchId }));
    }
  }, []);

  const unsubscribe = useCallback((matchId: number) => {
    desiredSubscriptions.current.delete(matchId);
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socketRef.current?.send(JSON.stringify({ type: "unsubscribe", matchId }));
    }
  }, []);

  const watchMatch = useCallback(
    (matchId: number) => {
      if (
        activeMatchIdRef.current !== null &&
        activeMatchIdRef.current !== matchId
      ) {
        unsubscribe(activeMatchIdRef.current);
      }

      setActiveMatchId(matchId);
      activeMatchIdRef.current = matchId;

      // clear old commentary and show loading
      setCommentary([]);
      setIsCommentaryLoading(true);

      //subscribe to live updates for this match
      subscribe(matchId);

      // fetch historical commentary
      fetchMatchCommentary(matchId)
        .then((response) => {
          // only apply if we're still watching this match
          if (activeMatchIdRef.current !== matchId) return;
          // historical goes after live (new arrivals prepend)
          // reverse the historical so newest is first, consistent with live

          const historical = [...response.data];
          setCommentary((prev) => [...prev, ...historical]);
        })
        .catch((err) => console.error("Failed to load commentary:", err))
        .finally(() => {
          if (activeMatchIdRef.current === matchId) {
            setIsCommentaryLoading(false);
          }
        });
    },
    [subscribe, unsubscribe],
  );

  const unwatchMatch = useCallback(
    (matchId: number) => {
      unsubscribe(matchId);
      if (activeMatchIdRef.current === matchId) {
        setActiveMatchId(null);
        activeMatchIdRef.current = null;
        setCommentary([]);
        setIsCommentaryLoading(false);
      }
    },
    [unsubscribe],
  );

  useEffect(() => {
    activeMatchIdRef.current = activeMatchId;
  }, [activeMatchId]);

  useEffect(() => {
    fetchMatches()
      .then((r) => {
        setMatches((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const newOnes = r.data.filter((m) => !seen.has(m.id));
          return [...prev, ...newOnes];
        });
      })
      .catch(console.error);

    const ws = createSocket();
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      for (const matchId of desiredSubscriptions.current) {
        ws.send(JSON.stringify({ type: "subscribe", matchId }));
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.error("WS error:", err);

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
          if (msg.data.matchId !== activeMatchIdRef.current) return;
          setCommentary((prev) => [msg.data, ...prev]);
          break;

        case "match_created":
          setMatches((prev) => {
            if (prev.some((m) => m.id === msg.data.id)) return prev;
            return [msg.data, ...prev];
          });
          break;

        case "score_update":
          setMatches((prev) =>
            prev.map((m) =>
              m.id === msg.matchId
                ? {
                    ...m,
                    homeScore: msg.data.homeScore,
                    awayScore: msg.data.awayScore,
                  }
                : m,
            ),
          );
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
    matches,
    commentary,
    subscribedMatches,
    activeMatchId,
    isCommentaryLoading,
    subscribe,
    unsubscribe,
    watchMatch,
    unwatchMatch,
  };
}
