import type { CommentaryResponse, MatchResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function fetchMatches(limit = 50) {
  return request<MatchResponse>(`/api/matches?limit=${limit}`);
}

export function fetchMatchCommentary(matchId: number | string, limit = 100) {
  return request<CommentaryResponse>(
    `/api/matches/${matchId}/commentary?limit=${limit}`,
  );
}
