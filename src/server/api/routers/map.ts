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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    .input(z.object({ cityId: z.string().default("emory") }))
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

  /**
   * Returns aggregated stats for the Stats page.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [user, exploredPoints, userPins] = await Promise.all([
      ctx.db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { createdAt: true },
      }),
      ctx.db.exploredPoint.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { lat: true, lng: true, createdAt: true },
      }),
      ctx.db.pin.findMany({
        where: { createdById: userId },
        include: { _count: { select: { upvotes: true } } },
      }),
    ]);

    // Total distance — sum haversine of consecutive points, skip jumps > 1 km
    let totalDistanceKm = 0;
    for (let i = 1; i < exploredPoints.length; i++) {
      const prev = exploredPoints[i - 1]!;
      const curr = exploredPoints[i]!;
      const d = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
      if (d < 1) totalDistanceKm += d;
    }

    // Days active — distinct calendar days with at least one point
    const distinctDays = new Set(
      exploredPoints.map((p) => {
        const d = new Date(p.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      })
    );

    // Weekly progress — last 7 calendar days
    const now = new Date();
    const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayPoints = exploredPoints.filter(
        (p) => p.createdAt >= dayStart && p.createdAt < dayEnd
      );

      let dayKm = 0;
      for (let j = 1; j < dayPoints.length; j++) {
        const prev = dayPoints[j - 1]!;
        const curr = dayPoints[j]!;
        const d = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
        if (d < 1) dayKm += d;
      }

      return {
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        date: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        km: Math.round(dayKm * 10) / 10,
      };
    });

    // Top 3 pins by upvotes
    const topPins = [...userPins]
      .sort((a, b) => b._count.upvotes - a._count.upvotes)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        title: p.title,
        upvotes: p._count.upvotes,
        location: `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`,
      }));

    const totalUpvotes = userPins.reduce((sum, p) => sum + p._count.upvotes, 0);

    return {
      joinDate: user.createdAt,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      daysActive: distinctDays.size,
      pinsPlaced: userPins.length,
      totalUpvotes,
      topPins,
      weeklyProgress,
    };
  }),
});

