import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { QUEST_DEFINITIONS } from "~/app/_components/quests/questData";

export const questRouter = createTRPCRouter({
  getXp: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: { xp: true },
    });
    return { xp: user.xp };
  }),

  getCompletedQuests: protectedProcedure.query(async ({ ctx }) => {
    const completions = await ctx.db.questCompletion.findMany({
      where: { userId: ctx.session.user.id },
      select: { questId: true, xpAwarded: true, collectedAt: true },
    });
    return completions;
  }),

  collectReward: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const def = QUEST_DEFINITIONS.find(q => q.id === input.questId);
      if (!def) throw new Error("Quest not found");

      const existing = await ctx.db.questCompletion.findUnique({
        where: { userId_questId: { userId: ctx.session.user.id, questId: input.questId } },
      });
      if (existing) throw new Error("Reward already collected");

      const [completion] = await ctx.db.$transaction([
        ctx.db.questCompletion.create({
          data: {
            userId: ctx.session.user.id,
            questId: input.questId,
            xpAwarded: def.reward.xp,
          },
        }),
        ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { xp: { increment: def.reward.xp } },
        }),
      ]);

      return { xpAwarded: completion.xpAwarded };
    }),
});
