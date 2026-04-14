import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
 
const MAX_UPVOTES_PER_USER = 2;
 
export const pinRouter = createTRPCRouter({
  // ── Get all pins (with caller's upvote count) ──────────────────────────────
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
 
    const pins = await ctx.db.pin.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        upvotes: {
          where: { userId },
          select: { id: true },
        },
        _count: { select: { upvotes: true } },
      },
    });
 
    return pins.map((pin) => ({
      id: pin.id,
      title: pin.title,
      description: pin.description,
      lat: pin.lat,
      lng: pin.lng,
      upvotes: pin._count.upvotes,
      myUpvotes: pin.upvotes.length,
      createdById: pin.createdById,
      creatorName: pin.createdBy.name,
      createdAt: pin.createdAt, // ← added
    }));
  }),
 
  // ── Create a pin at the caller's location ──────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(60),
        description: z.string().max(280).optional(),
        lat: z.number().finite(),
        lng: z.number().finite(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayCount = await ctx.db.pin.count({
        where: {
          createdById: ctx.session.user.id,
          createdAt: { gte: startOfDay },
        },
      });

      if (todayCount >= 2) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You can only drop 2 pins per day.",
        });
      }

      return ctx.db.pin.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          lat: input.lat,
          lng: input.lng,
          createdById: ctx.session.user.id,
        },
      });
    }),
 
  // ── Update a pin (owner only) ──────────────────────────────────────────────
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(60),
        description: z.string().max(280).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pin = await ctx.db.pin.findUnique({ where: { id: input.id } });
      if (pin?.createdById !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      return ctx.db.pin.update({
        where: { id: input.id },
        data: { title: input.title, description: input.description ?? null },
      });
    }),
 
  // ── Delete a pin (owner only) ──────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pin = await ctx.db.pin.findUnique({ where: { id: input.id } });
      if (pin?.createdById !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      await ctx.db.pin.delete({ where: { id: input.id } });
      return { success: true };
    }),
 
  // ── Upvote a pin ───────────────────────────────────────────────────────────
  upvote: protectedProcedure
    .input(z.object({ pinId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
 
      const existing = await ctx.db.pinUpvote.count({
        where: { pinId: input.pinId, userId },
      });
 
      if (existing >= MAX_UPVOTES_PER_USER) {
        throw new Error("Maximum upvotes reached for this pin");
      }
 
      await ctx.db.pinUpvote.create({
        data: { pinId: input.pinId, userId },
      });
 
      return { success: true };
    }),
 
  // ── Undo one upvote ────────────────────────────────────────────────────────
  undoUpvote: protectedProcedure
    .input(z.object({ pinId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
 
      const latest = await ctx.db.pinUpvote.findFirst({
        where: { pinId: input.pinId, userId },
        orderBy: { createdAt: "desc" },
      });
 
      if (!latest) return { success: false };
 
      await ctx.db.pinUpvote.delete({ where: { id: latest.id } });
 
      return { success: true };
    }),
});