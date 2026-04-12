import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { AppShell } from "./shell";
import { ProfilePopup } from "../_components/profile/profile-popup";

export default async function AppPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  void api.quest.getXp.prefetch();
  void api.quest.getCompletedQuests.prefetch();

  return (
import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { AppShell } from "./shell";
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
      <div className="relative">
        <AppShell
          user={{
            id: session.user.id,
            name: session.user.name ?? undefined,
            imageUrl: session.user.image ?? undefined,
          }}
        />

        <div className="fixed right-4 top-4 z-50">
          <ProfilePopup
            user={{
              name: session.user.name,
              image: session.user.image,
            }}
          />
        </div>
      </div>
    </HydrateClient>
  );
}
