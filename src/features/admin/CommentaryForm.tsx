import { useEffect, useState } from "react";
import { adminRequest, fetchMatches } from "../../lib/api";
import type { Match } from "../../types";

type Status = "idle" | "loading" | "success" | "error";

export function CommentaryForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState<number | "">("");
  const [minutes, setMinutes] = useState("");
  const [eventType, setEventType] = useState("");
  const [actor, setActor] = useState("");
  const [team, setTeam] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches()
      .then((r) => setMatches(r.data))
      .catch(() => setMatches([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) {
      setError("Please select a match.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      await adminRequest(`/api/matches/${matchId}/commentary`, {
        method: "POST",
        body: JSON.stringify({
          minutes: minutes ? Number(minutes) : null,
          message: message.trim(),
          eventType: eventType.trim() || undefined,
          actor: actor.trim() || undefined,
          team: team.trim() || undefined,
        }),
      });

      setStatus("success");
      setMinutes("");
      setEventType("");
      setActor("");
      setTeam("");
      setMessage("");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post commentary");
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-black rounded-2xl shadow-hard p-6 space-y-4"
    >
      <h2 className="font-bold text-lg border-l-4 border-brand-blue pl-3">
        Post Commentary
      </h2>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1">
          Match
        </label>
        <select
          value={matchId}
          onChange={(e) => setMatchId(e.target.value ? Number(e.target.value) : "")}
          required
          className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">Select a match...</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.homeTeam} vs {m.awayTeam} ({m.sport})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Minute
          </label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            min="0"
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Type
          </label>
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="goal"
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Actor
          </label>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Team
          </label>
          <input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border-2 border-black rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer"
      >
        {status === "loading" ? "Posting..." : "Post Commentary"}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      {status === "success" && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          Commentary posted ✓
        </div>
      )}
    </form>
  );
}