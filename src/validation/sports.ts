import { z } from "zod";

const inningsSchema = z.object({
    runs: z.number().int().min(0),
    wickets: z.number().int().min(0).max(10),
    overs: z.number().min(0),
    declared: z.boolean().optional(),
});

export const cricketStatsSchema = z.object({
    format: z.enum(["t20", "odi", "test"]),
    homeInnings: z.array(inningsSchema).max(2),
    awayInnings: z.array(inningsSchema).max(2),
    currentBatting: z.enum(["home", "away"]).optional(),
    currentDay: z.number().int().min(1).max(5).optional(),
    daysPlayed: z.number().int().min(0).max(5).optional(),
});

export type CricketStats = z.infer<typeof cricketStatsSchema>;
export type Innings = z.infer<typeof inningsSchema>;