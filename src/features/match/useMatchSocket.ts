import { useCallback, useEffect, useRef, useState } from "react";
import { type Commentary, type Match, serverMessageSchema } from "../../types";
import { createSocket } from "../../lib/ws";
import { fetchMatchCommentary, fetchMatches } from "../../lib/api";

const MAX_RECONNECT_ATTEMPTS = 10;

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
  const pendingScoresRef = useRef<
    Map<
      number,
      {
        homeScore: number;
        awayScore: number;
        stats: Record<string, unknown> | null;
      }
    >
  >(new Map());
  const requestTokenRef = useRef(0);

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
      if (!Number.isFinite(matchId) || matchId <= 0) {
        console.warn("watchMatch called with invalid matchId:", matchId);
        return;
      }

      const token = ++requestTokenRef.current;

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
          if (requestTokenRef.current !== token) return;
          // only apply if we're still watching this match
          if (activeMatchIdRef.current !== matchId) return;

          // historical goes after live (new arrivals prepend)
          // reverse the historical so newest is first, consistent with live

          const historical = [...response.data];
          setCommentary((prev) => [...prev, ...historical]);
        })
        .catch((err) => {
          if (requestTokenRef.current !== token) return;
          console.error("Failed to load commentary:", err);
        })
        .finally(() => {
          if (requestTokenRef.current !== token) return;
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
        requestTokenRef.current++;
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
    let cancelled = false;
    let reconnectAttempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    fetchMatches()
      .then((r) => {
        setMatches((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const newOnes = r.data.filter((m) => !seen.has(m.id));

          // apply any buffered scores to the fetched matches
          const withBufferedScores = newOnes.map((m) => {
            const buffered = pendingScoresRef.current.get(m.id);
            if (!buffered) return m;
            pendingScoresRef.current.delete(m.id);
            return {
              ...m,
              homeScore: buffered.homeScore,
              awayScore: buffered.awayScore,
              sportStats: buffered.stats ?? m.sportStats,
            };
          });
          return [...prev, ...withBufferedScores];
        });
      })
      .catch(console.error);

    const connect = () => {
      if (cancelled) return;

      const ws = createSocket();
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        setConnected(true);

        for (const matchId of desiredSubscriptions.current) {
          ws.send(JSON.stringify({ type: "subscribe", matchId }));
        }
      };

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

              const buffered = pendingScoresRef.current.get(msg.data.id);
              const match = buffered ? { ...msg.data, ...buffered } : msg.data;
              if (buffered) pendingScoresRef.current.delete(msg.data.id);

              return [match, ...prev];
            });
            break;

          case "score_update":
            setMatches((prev) => {
              const exists = prev.some((m) => m.id === msg.matchId);

              if (!exists) {
                // Match not loaded yet — buffer the score for later
                pendingScoresRef.current.set(msg.matchId, {
                  homeScore: msg.data.homeScore,
                  awayScore: msg.data.awayScore,
                  stats: msg.data.stats ?? null,
                });
                return prev;
              }

              return prev.map((m) =>
                m.id === msg.matchId
                  ? {
                      ...m,
                      homeScore: msg.data.homeScore,
                      awayScore: msg.data.awayScore,
                      sportStats: msg.data.stats ?? m.sportStats,
                    }
                  : m,
              );
            });
            break;

          case "error":
            console.error("Server error:", msg.message);
            break;
        }
      };
      ws.onclose = () => {
        setConnected(false);

        if (cancelled) return;

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn("Max reconnect attempts reached");
          return;
        }

        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
        reconnectAttempts++;
        console.info(
          `Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`,
        );

        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = (err) => console.error("WS error:", err);
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
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
