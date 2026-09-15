import { z } from "zod";
import { CommentaryResponseSchema, MatchResponseSchema } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    console.error("Invalid response shape:", parsed.error.issues);
    throw new Error("Unexpected response from server");
  }

  return parsed.data;
}

export function fetchMatches(limit = 50) {
  return request(`/api/matches?limit=${limit}`, MatchResponseSchema);
}

export function fetchMatchCommentary(matchId: number | string, limit = 100) {
  return request(
    `/api/matches/${matchId}/commentary?limit=${limit}`,
    CommentaryResponseSchema
  );
}
