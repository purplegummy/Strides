import { postRouter } from "~/server/api/routers/post";
import { mapRouter } from "~/server/api/routers/map";
import { pinRouter } from "~/server/api/routers/pin";
import { questRouter } from "~/server/api/routers/quest";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  map: mapRouter,
  pin: pinRouter,
  quest: questRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
