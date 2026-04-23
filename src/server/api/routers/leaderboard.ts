import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getCity } from "~/server/config/cities";
import { getTilesInRadius, isTileInCity, isPointInCity } from "~/server/utils/exploration";

const CITY_ID = "emory";

export const leaderboardRouter = createTRPCRouter({
  getLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    const city = getCity(CITY_ID);
    if (!city) throw new TRPCError({ code: "NOT_FOUND", message: "City not found" });

    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        xp: true,
        _count: {
          select: {
            questCompletions: true,
            pins: true,
          },
        },
        exploredPoints: {
          select: { lat: true, lng: true },
        },
      },
    });

    const entries = users.map((user) => {
      const discoveredTiles = new Set<string>();
      for (const pt of user.exploredPoints) {
        if (!isPointInCity(pt.lat, pt.lng, city)) continue;
        for (const key of getTilesInRadius(pt.lat, pt.lng, 25, city)) {
          if (isTileInCity(key, city)) discoveredTiles.add(key);
        }
      }

      return {
        id: user.id,
        name: user.name,
        image: user.image ?? null,
        xp: user.xp,
        questsCompleted: user._count.questCompletions,
        pinsPlaced: user._count.pins,
        tilesDiscovered: discoveredTiles.size,
        isCurrentUser: user.id === currentUserId,
      };
    });

    return entries;
  }),
});
