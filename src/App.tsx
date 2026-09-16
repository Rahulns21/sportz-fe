import { useMatchSocket } from "./features/match/useMatchSocket";

export default function App() {
  const {
    connected,
    commentary,
    subscribedMatches,
    matches,
    subscribe,
    unsubscribe,
  } = useMatchSocket();

  return (
    <div style={{ padding: 20 }}>
      <h1>sportz</h1>

      <p>Connected: {connected ? "🟢" : "🔴"}</p>
      <p>Subscribed to: {[...subscribedMatches].join(", ") || "none"}</p>

      <div className="flex gap-2">
        <button
          className="btn cursor-pointer rounded bg-green-500 px-2 text-white"
          onClick={() => subscribe(1)}
        >
          Subscribe
        </button>
        <button
          className="btn cursor-pointer rounded bg-red-500 px-2 text-white"
          onClick={() => unsubscribe(1)}
        >
          Unsubscribe
        </button>
      </div>

      <h2>Live commentary:</h2>
      <div className="flex flex-col gap-5">
        <ul>
          {commentary.map((c) => (
            <li key={c.id}>
              {c.minutes !== null ? `${c.minutes}' - ` : ""} {c.message}
            </li>
          ))}
        </ul>
        <ol className="list-decimal list-inside">
          {matches.map((m) => (
            <li key={m.id}>
              {m.homeTeam} vs {m.awayTeam}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
