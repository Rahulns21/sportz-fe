import { z } from "zod";
import { CommentaryResponseSchema, MatchResponseSchema } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API_KEY_STORAGE_KEY = "sportz.adminApiKey";

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

export function setAdminKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function getAdminKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function clearAdminKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit & { method: "POST" | "PATCH" | "DELETE" },
): Promise<T> {
  const apiKey = getAdminKey();
  if (!apiKey) {
    throw new Error("No admin API key configured");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...options.headers
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}