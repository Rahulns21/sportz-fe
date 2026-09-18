import { useNavigate, useParams } from "react-router-dom";
import { LiveFeed } from "../features/match/LiveFeed";
import { MatchCard } from "../features/match/MatchCard";
import { useMatchSocket } from "../features/match/useMatchSocket";
import { StatusIndicator } from "../features/socket/StatusIndicator";
import { useEffect } from "react";


export function DashboardPage() {
    const { matchId } = useParams<{ matchId: string}>();
    const navigate = useNavigate();

  const {
    connected,
    matches,
    commentary,
    activeMatchId,
    isCommentaryLoading,
    watchMatch,
    unwatchMatch,
  } = useMatchSocket();

  useEffect(() => {
    const id = matchId ? Number(matchId) : null;

    if (id === null) {
        if (activeMatchId !== null) unwatchMatch(activeMatchId);
        return;
    }
    if (id !== activeMatchId) {
        watchMatch(id);
    }
  }, [matchId, activeMatchId, watchMatch, unwatchMatch]);

  const handleWatch = (id: number) => navigate(`/matches/${id}`);
  const handleUnwatch = () => navigate("/");

  return (
    <div className="min-h-screen p-4 font-sans md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="bg-brand-yellow shadow-hard flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-black p-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-brand-dark mb-1 text-3xl font-black tracking-tight">
              Sportz
            </h1>
            <p className="text-sm font-medium opacity-80">
              Real-time match data
            </p>
          </div>
          <StatusIndicator connected={connected} />
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Match List */}
          <main className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="border-brand-blue border-l-4 pl-3 text-xl font-bold">
                Current Matches
              </h2>
            </div>

            {matches.length === 0 ? (
              <div className="rounded-2xl border-2 border-black bg-gray-50 p-12 text-center">
                <p className="text-lg font-bold">No matches found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isActive={activeMatchId === match.id}
                    onWatch={handleWatch}
                    onUnwatch={handleUnwatch}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Right: Live Feed (sticky on desktop) */}
          <aside className="h-125 lg:sticky lg:top-8 lg:col-span-1 lg:h-[calc(100vh-140px)]">
            <LiveFeed
              messages={commentary}
              isActive={activeMatchId !== null}
              isLoading={isCommentaryLoading}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
