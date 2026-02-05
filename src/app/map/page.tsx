import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { MapClient } from "./MapClient";

export default async function MapPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Your map</h1>
          <p className="text-white/70">
            Walk around to reveal the fog. Location is saved to your account.
          </p>
        </div>

        <MapClient
          user={{
            id: session.user.id,
            name: session.user.name ?? undefined,
            imageUrl: session.user.image ?? undefined,
          }}
        />
      </div>
    </main>
  );
}

