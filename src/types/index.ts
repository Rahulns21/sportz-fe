export interface Match {
    id: number;
    sport: string;
    homeTeam: string;
    awayTeam: string;
    status: "scheduled" | "live" | "finished";
    startTime: string | null;
    endTime: string | null;
    homeScore: number;
    awayScore: number;
    createdAt: string;
    updatedAt: string;
}

export interface Commentary {
    id: number;
    matchId: number;
    minutes: number | null;
    sequence: number | null;
    period: string | null;
    eventType: string | null;
    actor: string | null;
    team: string | null;
    message: string;
    metadata: Record<string, unknown> | null;
    tags: string[] | null;
    createdAt: string;
}

export interface MatchResponse {
    data: Match[];
}

export interface CommentaryResponse {
    data: Commentary[];
}