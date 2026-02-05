import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { AppShell } from "./shell";

export default async function AppPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <AppShell
      user={{
        id: session.user.id,
        name: session.user.name ?? undefined,
        imageUrl: session.user.image ?? undefined,
      }}
    />
  );
}

