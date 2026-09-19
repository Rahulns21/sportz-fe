import type { Match } from "../../types";
import { cricketStatsSchema, type CricketStats } from "../../validation/sports"

interface CricketScoreDisplayProps {
    stats: CricketStats;
    side: "home" | "away";
}

interface ScoreDisplayProps {
    match: Match;
    side: "home" | "away";
    pulse: boolean;
}

export function CricketScoreDisplay({
    stats,
    side,
}: CricketScoreDisplayProps) {
    const innings = side === "home" ? stats.homeInnings : stats.awayInnings;
    if (innings.length === 0) {
        return <span className="text-lg font-bold text-gray-400">-</span>
    }

    return (
        <div className="text-right">
            {innings.map((inn, i) => (
                <div key={i} className="flex items-center justify-end gap-2">
                    <span className="font-bold text-xl">
                        {inn.runs}
                        {inn.wickets < 10 || !inn.declared ? `/${inn.wickets}` : ""}
                        {inn.declared ? "d" : ""}
                    </span>
                    <span className="text-xs text-gray-500">{inn.overs} overs</span>
                </div>
            ))}
        </div>
    )
}

export function ScoreDisplay({ match, side, pulse }: ScoreDisplayProps) {
    const score = side === "home" ? match.homeScore : match.awayScore;
    const cricketStats = cricketStatsSchema.safeParse(match.sportStats);

    if (match.sport === "cricket" && cricketStats.success) {
        return (
            <CricketScoreDisplay stats={cricketStats.data} side={side} />
        );
    }

    return (
        <span className={`min-w-12 rounded-lg border border-black px-3 py-1 text-center text-2xl font-bold transition-colors ${ pulse ? "bg-brand-yellow animate-pulse" : "bg-gray-100"}`}>
            {score}
        </span>
    )
}