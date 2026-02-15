"use client";

import { useCallback, useMemo, useState } from "react";

import { MapClient } from "~/app/map/MapClient";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { AppTabNav, type AppTab } from "./tab-nav";
import ExplorationBar from "~/app/_components/ExplorationBar";

type MapUser = {
  id: string;
  name?: string;
  imageUrl?: string;
};

export function AppShell({ user }: { user: MapUser }) {
  const [tab, setTab] = useState<AppTab>("map");
  const [signingOut, setSigningOut] = useState(false);

  const statsQuery = api.map.getExplorationStats.useQuery({ cityId: "atlanta" });
  const stats = statsQuery.data;

  const signOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const res = await authClient.signOut();
      if (res?.error) {
        console.error(res.error);
        setSigningOut(false);
        return;
      }
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setSigningOut(false);
    }
  }, [signingOut]);

  const overlays = useMemo(() => {
    if (tab !== "profile") return null;

    return (
      <div className="absolute inset-0 z-20 flex flex-col">
        <div className="flex-1 bg-black/25 backdrop-blur-sm" />
        <div className="rounded-t-3xl border-t border-white/10 bg-[#0b1020]/95 p-5 pb-28 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-4">
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={user.name ? `${user.name}'s avatar` : "Your avatar"}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/10" />
            )}
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">
                {user.name ?? "Profile"}
              </div>
              <div className="text-sm text-white/60">Coming soon.</div>
            </div>
          </div>

          <div className="mt-5 text-sm text-white/70">
            This is a placeholder panel. The map stays mounted underneath so
            switching tabs is instant.
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className={[
              "mt-6 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition",
              "hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    );
  }, [signOut, signingOut, tab, user.imageUrl, user.name]);

  return (
    <main className="relative min-h-[100dvh] bg-[#0b1020] text-white">
      {/* Map stays mounted regardless of tab */}
      <MapClient mode="minimal" user={user} />

      <div className="absolute top-0 left-0 right-0 z-10">
        <ExplorationBar
          percentage={stats?.percentage ?? 0}
          tilesDiscovered={stats?.tilesDiscovered ?? 0}
          totalTiles={stats?.totalTiles ?? 4096}
          streakDays={stats?.streakDays ?? 0}
        />
      </div>

      {/* Overlays/panels */}
      {overlays}

      {/* Bottom tabs (client-state, no route changes) */}
      <AppTabNav tab={tab} onChange={setTab} />
    </main>
  );
}

