import { z } from "zod";

export const matchSchema = z.object({
  id: z.number(),
  sport: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  status: z.enum(["scheduled", "live", "finished"]),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  homeScore: z.number(),
  awayScore: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const commentarySchema = z.object({
  id: z.number(),
  matchId: z.number(),
  minutes: z.number().nullable(),
  sequence: z.number().nullable(),
  period: z.string().nullable(),
  eventType: z.string().nullable(),
  actor: z.string().nullable(),
  team: z.string().nullable(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  tags: z.array(z.string()).nullable(),
  createdAt: z.string(),
});

export const serverMessageSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("welcome") }),
    z.object({ type: z.literal("subscribed"), matchId: z.number() }),
    z.object({ type: z.literal("unsubscribed"), matchId: z.number() }),
    z.object({ type: z.literal("already_subscribed"), matchId: z.number() }),
    z.object({ type: z.literal("not_subscribed"), matchId: z.number() }),
    z.object({ type: z.literal("commentary"), data: commentarySchema }),
    z.object({ type: z.literal("match_created"), data: matchSchema }),
    z.object({
        type: z.literal("error"),
        message: z.string(),
        matchId: z.number().optional(),
    }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export const MatchResponseSchema = z.object({
  data: z.array(matchSchema),
});

export const CommentaryResponseSchema = z.object({
  data: z.array(commentarySchema),
});

export type Match = z.infer<typeof matchSchema>;
export type Commentary = z.infer<typeof commentarySchema>;
export type MatchResponse = z.infer<typeof MatchResponseSchema>;
export type CommentaryResponse = z.infer<typeof CommentaryResponseSchema>;
