import { useMatchSocket } from "./features/match/useMatchSocket";

export default function App() {
  const { connected, commentary, subscribedMatches, subscribe, unsubscribe } =
    useMatchSocket();

  return (
    <div style={{ padding: 20 }}>
      <h1>sportz</h1>

      <p>Connected: {connected ? "🟢" : "🔴"}</p>
      <p>Subscribed to: {[...subscribedMatches].join(", ") || "none"}</p>

      <div className="flex gap-2">
        <button
          className="btn rounded bg-green-500 px-2 text-white cursor-pointer"
          onClick={() => subscribe(1)}
        >
          Subscribe
        </button>
        <button
          className="btn rounded bg-red-500 px-2 text-white cursor-pointer"
          onClick={() => unsubscribe(1)}
        >
          Unsubscribe
        </button>
      </div>

      <h2>Live commentary</h2>
      <ul>
        {commentary.map((c) => (
          <li key={c.id}>
            {c.minutes}' - {c.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
