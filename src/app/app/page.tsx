import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { AppShell } from "./shell";

export default async function AppPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  async function signOut() {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
    redirect("/");
  }

  return (
    <AppShell
      user={{
        id: session.user.id,
        name: session.user.name ?? undefined,
        imageUrl: session.user.image ?? undefined,
      }}
      onSignOut={signOut}
    />
  );
}

