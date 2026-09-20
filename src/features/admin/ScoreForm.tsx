import { useEffect, useState } from "react";
import { adminRequest, fetchMatches } from "../../lib/api";
import type { Match } from "../../types";
import type { CricketStats, Innings } from "../../validation/sports";

type Status = "idle" | "loading" | "success" | "error";

export function ScoreForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");

  useEffect(() => {
    fetchMatches()
      .then((r) => setMatches(r.data))
      .catch(() => setMatches([]));
  }, []);

  const selectedMatch = matches.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="bg-white border-2 border-black rounded-2xl shadow-hard p-6 space-y-4">
      <h2 className="font-bold text-lg border-l-4 border-brand-blue pl-3">
        Update Score
      </h2>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1">
          Match
        </label>
        <select
          value={selectedId}
          onChange={(e) =>
            setSelectedId(e.target.value ? Number(e.target.value) : "")
          }
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

      {selectedMatch && (
        <ScoreFormBody key={selectedMatch.id} match={selectedMatch} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Dispatches by sport
// ─────────────────────────────────────────────

function ScoreFormBody({ match }: { match: Match }) {
  if (match.sport === "cricket") {
    return <CricketScoreForm match={match} />;
  }
  return <GenericScoreForm match={match} />;
}

// ─────────────────────────────────────────────
// Generic (football, basketball, etc.)
// ─────────────────────────────────────────────

function GenericScoreForm({ match }: { match: Match }) {
  const [homeScore, setHomeScore] = useState(match.homeScore);
  const [awayScore, setAwayScore] = useState(match.awayScore);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      await adminRequest(`/api/matches/${match.id}/score`, {
        method: "PATCH",
        body: JSON.stringify({ homeScore, awayScore }),
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update score");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            {match.homeTeam}
          </label>
          <input
            type="number"
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 border-2 border-black rounded-lg text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            {match.awayTeam}
          </label>
          <input
            type="number"
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 border-2 border-black rounded-lg text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer"
      >
        {status === "loading" ? "Updating..." : "Update Score"}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      {status === "success" && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          Score updated ✓
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────
// Cricket (innings-based)
// ─────────────────────────────────────────────

const EMPTY_INNINGS: Innings = { runs: 0, wickets: 0, overs: 0 };

function CricketScoreForm({ match }: { match: Match }) {
  const existing = match.sportStats as CricketStats | null;

  const [stats, setStats] = useState<CricketStats>(
    existing ?? {
      format: "test",
      homeInnings: [{ ...EMPTY_INNINGS }],
      awayInnings: [{ ...EMPTY_INNINGS }],
      currentBatting: "home",
      currentDay: 1,
    },
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const updateInnings = (
    side: "homeInnings" | "awayInnings",
    index: number,
    field: keyof Innings,
    value: number | boolean,
  ) => {
    setStats((prev) => ({
      ...prev,
      [side]: prev[side].map((inn, i) =>
        i === index ? { ...inn, [field]: value } : inn,
      ),
    }));
  };

  const addInnings = (side: "homeInnings" | "awayInnings") => {
    setStats((prev) => {
      if (prev[side].length >= 2) return prev;
      return { ...prev, [side]: [...prev[side], { ...EMPTY_INNINGS }] };
    });
  };

  const removeInnings = (side: "homeInnings" | "awayInnings", index: number) => {
    setStats((prev) => {
      if (prev[side].length <= 1) return prev;
      return { ...prev, [side]: prev[side].filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    // homeScore/awayScore = last innings' runs, so the dashboard card shows the current score
    const lastHome = stats.homeInnings[stats.homeInnings.length - 1];
    const lastAway = stats.awayInnings[stats.awayInnings.length - 1];

    try {
      await adminRequest(`/api/matches/${match.id}/score`, {
        method: "PATCH",
        body: JSON.stringify({
          homeScore: lastHome?.runs ?? 0,
          awayScore: lastAway?.runs ?? 0,
          stats,
        }),
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update score");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Format
          </label>
          <select
            value={stats.format}
            onChange={(e) =>
              setStats((prev) => ({
                ...prev,
                format: e.target.value as CricketStats["format"],
              }))
            }
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="t20">T20</option>
            <option value="odi">ODI</option>
            <option value="test">Test</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1">
            Current Day
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={stats.currentDay ?? 1}
            onChange={(e) =>
              setStats((prev) => ({
                ...prev,
                currentDay: Number(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <InningsEditor
        label={match.homeTeam}
        innings={stats.homeInnings}
        side="homeInnings"
        onUpdate={updateInnings}
        onAdd={addInnings}
        onRemove={removeInnings}
      />

      <InningsEditor
        label={match.awayTeam}
        innings={stats.awayInnings}
        side="awayInnings"
        onUpdate={updateInnings}
        onAdd={addInnings}
        onRemove={removeInnings}
      />

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1">
          Currently Batting
        </label>
        <div className="flex gap-2">
          {(["home", "away"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setStats((prev) => ({ ...prev, currentBatting: side }))}
              className={`flex-1 px-3 py-2 rounded-lg border-2 border-black text-sm font-bold cursor-pointer transition-colors ${
                stats.currentBatting === side
                  ? "bg-brand-yellow"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {side === "home" ? match.homeTeam : match.awayTeam}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer"
      >
        {status === "loading" ? "Updating..." : "Update Score"}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      {status === "success" && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          Score updated ✓
        </div>
      )}
    </form>
  );
}

interface InningsEditorProps {
  label: string;
  innings: Innings[];
  side: "homeInnings" | "awayInnings";
  onUpdate: (
    side: "homeInnings" | "awayInnings",
    index: number,
    field: keyof Innings,
    value: number | boolean,
  ) => void;
  onAdd: (side: "homeInnings" | "awayInnings") => void;
  onRemove: (side: "homeInnings" | "awayInnings", index: number) => void;
}

function InningsEditor({
  label,
  innings,
  side,
  onUpdate,
  onAdd,
  onRemove,
}: InningsEditorProps) {
  return (
    <div className="border-2 border-black rounded-lg p-3 space-y-2 bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        {innings.length < 2 && (
          <button
            type="button"
            onClick={() => onAdd(side)}
            className="text-[10px] bg-white border border-black rounded px-2 py-0.5 font-bold hover:bg-gray-100 cursor-pointer"
          >
            + Add innings
          </button>
        )}
      </div>

      {innings.map((inn, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase mb-0.5">
              Runs
            </label>
            <input
              type="number"
              min="0"
              value={inn.runs}
              onChange={(e) => onUpdate(side, i, "runs", Number(e.target.value))}
              className="w-full px-2 py-1 border border-black rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase mb-0.5">
              Wickets
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={inn.wickets}
              onChange={(e) => onUpdate(side, i, "wickets", Number(e.target.value))}
              className="w-full px-2 py-1 border border-black rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase mb-0.5">
              Overs
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={inn.overs}
              onChange={(e) => onUpdate(side, i, "overs", Number(e.target.value))}
              className="w-full px-2 py-1 border border-black rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer">
              <input
                type="checkbox"
                checked={inn.declared ?? false}
                onChange={(e) => onUpdate(side, i, "declared", e.target.checked)}
                className="cursor-pointer"
              />
              Decl.
            </label>
            {innings.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(side, i)}
                className="text-[10px] text-red-600 border border-red-300 rounded px-1 font-bold hover:bg-red-50 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}