import { useState } from "react";
import { adminRequest } from "../../lib/api";

type Status = "idle" | "loading" | "success" | "error";

export function CreateMatchForm() {
  const [sport, setSport] = useState("football");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      await adminRequest("/api/matches", {
        method: "POST",
        body: JSON.stringify({
          sport,
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      setStatus("success");
      setHomeTeam("");
      setAwayTeam("");
      setStartTime("");
      setEndTime("");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create match");
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-black rounded-2xl shadow-hard p-6 space-y-4"
    >
      <h2 className="font-bold text-lg border-l-4 border-brand-blue pl-3">
        Create Match
      </h2>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1">
          Sport
        </label>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="football">Football</option>
          <option value="cricket">Cricket</option>
          <option value="basketball">Basketball</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Home Team
          </label>
          <input
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            required
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Away Team
          </label>
          <input
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            required
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Start
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            End
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer"
      >
        {status === "loading" ? "Creating..." : "Create Match"}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      {status === "success" && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          Match created ✓
        </div>
      )}
    </form>
  );
}