import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getCity } from "~/server/config/cities";
import {
  computeStreakDays,
  getTilesInRadius,
  getTotalTilesForCity,
  isPointInCity,
  isTileInCity,
} from "~/server/utils/exploration";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const mapRouter = createTRPCRouter({
  /**
   * Returns the most recent explored points for the current user.
   * We cap results to avoid unbounded growth over time.
   */
  getRecentExploredPoints: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(10_000).default(5_000),
      }),
    )
    .query(async ({ ctx, input }) => {
      const points = await ctx.db.exploredPoint.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          lat: true,
          lng: true,
          accuracyM: true,
          createdAt: true,
        },
      });

      // Return chronological order for easier client replay
      return points.reverse();
    }),

  /**
   * Adds explored points for the current user.
   * Client is responsible for sampling/throttling (e.g. only when moved ~10m).
   */
  addExploredPoints: protectedProcedure
    .input(
      z.object({
        points: z
          .array(
            z.object({
              lat: z.number().finite(),
              lng: z.number().finite(),
              accuracyM: z.number().finite().positive().optional(),
              createdAt: z.date().optional(),
            }),
          )
          .min(1)
          .max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const created = await ctx.db.exploredPoint.createMany({
        data: input.points.map((p) => ({
          userId,
          lat: p.lat,
          lng: p.lng,
          accuracyM: p.accuracyM,
          createdAt: p.createdAt,
        })),
      });

      return { createdCount: created.count };
    }),

  /**
   * Returns exploration stats for the current user in a given city.
   * Used by the ExplorationBar to show tiles discovered, percentage, and streak.
   */
  getExplorationStats: protectedProcedure
    .input(z.object({ cityId: z.string().default("atlanta") }))
    .query(async ({ ctx, input }) => {
      const city = getCity(input.cityId);
      if (!city)
        throw new TRPCError({ code: "NOT_FOUND", message: "City not found" });

      const points = await ctx.db.exploredPoint.findMany({
        where: { userId: ctx.session.user.id },
        select: { lat: true, lng: true, createdAt: true },
      });

      const discoveredTiles = new Set<string>();
      for (const p of points) {
        if (!isPointInCity(p.lat, p.lng, city)) continue;
        for (const key of getTilesInRadius(p.lat, p.lng, 25, city)) {
          if (isTileInCity(key, city)) discoveredTiles.add(key);
        }
      }

      const totalTiles = getTotalTilesForCity(city);
      const tilesDiscovered = discoveredTiles.size;
      const percentage =
        totalTiles > 0
          ? Math.min(100, (tilesDiscovered / totalTiles) * 100)
          : 0;
      const streakDays = computeStreakDays(points);

      return {
        percentage,
        tilesDiscovered,
        totalTiles,
        streakDays,
      };
    }),
});

