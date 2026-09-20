import { useState } from "react";
import { clearAdminKey, getAdminKey, setAdminKey } from "../lib/api";
import { CreateMatchForm } from "../features/admin/CreateMatchForm";
import { ScoreForm } from "../features/admin/ScoreForm";
import { CommentaryForm } from "../features/admin/CommentaryForm";

export function AdminPage() {
  const [hasKey, setHasKey] = useState(() => getAdminKey() !== null);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (trimmed.length < 32) {
      setError("Key looks too short - expected 64 characters.");
      return;
    }
    setAdminKey(trimmed);
    setHasKey(true);
    setError(null);
  };

  const handleSignOut = () => {
    clearAdminKey();
    setHasKey(false);
    setKeyInput("");
  };

  if (!hasKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="shadow-hard w-full max-w-md rounded-2xl border-2 border-black bg-white p-8">
          <h1 className="mb-2 text-2xl font-black">Admin Access</h1>
          <p className="mb-6 text-sm text-gray-600">
            Paste your admin API key to continue. It's stored locally in the
            browser only.
          </p>
          <label className="mb-1 block text-xs font-bold tracking-wide uppercase">
            API Key
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
            placeholder="Paste your key..."
            className="focus:outline-none mb-4 w-full rounded-lg border-2 border-black px-3 py-2 font-mono text-sm"
            autoFocus
          />
          { error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
            </div>
          )}

          <button onClick={handleSaveKey} className="w-full bg-brand-yellow hover:bg-yellow-200 border-2 border-black rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer">
            Continue
          </button>

          <p className="mt-4 text-xs text-gray-500">
            Get the key from your backend's <code className="bg-gray-100 px-1 rounded">.env</code>{" "}
            file (<code className="bg-gray-100 px-1 rounded">ADMIN_API_KEY</code>)
          </p>
        </div>
      </div>
    );
  }

  // admin dashboard
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-yellow border-2 border-black rounded-2xl p-6 shadow-hard">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-brand-dark">
              Admin Panel
            </h1>
            <p className="text-sm font-medium opacity-80">
              Create matches, post commentary, update scores
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="self-start md:self-auto text-xs bg-white border-2 border-black rounded-lg px-3 py-1.5 font-bold hover:bg-gray-50 cursor-pointer"
          >
            Sign out
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreateMatchForm />
          <ScoreForm />
        </div>

        <CommentaryForm />
      </div>
    </div>
  );
}
