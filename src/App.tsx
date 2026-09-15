import { useEffect, useState } from "react";
import type { Match } from "./types";
import { fetchMatches } from "./lib/api";
import { createSocket } from "./lib/ws";

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [socketMsg, setSocketMsg] = useState("");

  useEffect(() => {
    fetchMatches().then((r) => setMatches(r.data));
  }, []);

  useEffect(() => {
    const ws = createSocket();
    ws.onmessage = (e) => setSocketMsg(e.data);
    return () => ws.close();
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>sportz</h1>
      <p>WS: {socketMsg}</p>
      <ol>
        {matches.map((m) => (
          <li key={m.id}>
            {m.homeTeam} vs {m.awayTeam} - {m.status}
          </li>
        ))}
      </ol>
    </div>
  );
}
