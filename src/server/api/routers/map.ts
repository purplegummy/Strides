import { z } from "zod";

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
});

