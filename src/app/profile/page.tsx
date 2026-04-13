import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { ProfilePopup } from "../_components/profile/profile-popup";

export default async function AppPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  void api.quest.getXp.prefetch();
  void api.quest.getCompletedQuests.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen items-start justify-center p-6">
        <ProfilePopup
          user={{
            name: session.user.name,
            image: session.user.image,
          }}
        />
      </main>
    </HydrateClient>
  );
}
