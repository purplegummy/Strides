"use client";

import { useMemo, useState } from "react";

import { MapClient } from "~/app/map/MapClient";
import { AppTabNav, type AppTab } from "./tab-nav";

type MapUser = {
  id: string;
  name?: string;
  imageUrl?: string;
};

export function AppShell({
  user,
  onSignOut,
}: {
  user: MapUser;
  onSignOut: () => Promise<void>;
}) {
  const [tab, setTab] = useState<AppTab>("map");

  const overlays = useMemo(() => {
    if (tab === "profile") {
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

            <form action={onSignOut} className="mt-6">
              <button
                type="submit"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      );
    }

    return null;
  }, [onSignOut, tab, user.imageUrl, user.name]);

  return (
    <main className="relative min-h-[100dvh] bg-[#0b1020] text-white">
      {/* Map stays mounted regardless of tab */}
      <MapClient mode="minimal" user={user} />

      {/* Overlays/panels */}
      {overlays}

      {/* Bottom tabs (client-state, no route changes) */}
      <AppTabNav tab={tab} onChange={setTab} />
    </main>
  );
}

