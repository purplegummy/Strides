import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { AppShell } from "./shell";

export default async function AppPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  await Promise.all([
    api.quest.getXp.prefetch(),
    api.quest.getCompletedQuests.prefetch(),
    api.map.getExplorationStats.prefetch({ cityId: "emory" }),
  ]);

  return (
    <HydrateClient>
      <AppShell
        user={{
          id: session.user.id,
          name: session.user.name ?? undefined,
          imageUrl: session.user.image ?? undefined,
        }}
      />
    </HydrateClient>
  );
}

