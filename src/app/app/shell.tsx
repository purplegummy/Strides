"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { ProfileBar } from "~/app/_components/profile/ProfileBar";
import StatsPage from "~/app/_components/stats/StatsPage";
import { MapClient } from "~/app/map/MapClient";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import type { AppTab } from "./tab-nav";
import ExplorationBar from "~/app/_components/exploration/ExplorationBar";
import { RadialNavButton, type NavTab } from "~/components/RadialNavButton";

type MapUser = {
  id: string;
  name?: string;
  imageUrl?: string;
};

export function AppShell({ user }: { user: MapUser }) {
  const [tab, setTab] = useState<AppTab>("map");
  const [navTab, setNavTab] = useState<NavTab>("map");
  const [signingOut, setSigningOut] = useState(false);

  const statsQuery = api.map.getExplorationStats.useQuery({ cityId: "atlanta" });
  const stats = statsQuery.data;
  const [hudOpen, setHudOpen] = useState(true);
  const [statsClosing, setStatsClosing] = useState(false);
  const statsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeStats = useCallback(() => {
    setStatsClosing(true);
    statsCloseTimer.current = setTimeout(() => {
      setTab("map");
      setNavTab("map");
      setStatsClosing(false);
    }, 300);
  }, []);

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
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setTab("map")}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
            >
              Back to map
            </button>
          </div>

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
      <MapClient user={user} />

      {tab !== "stats" && (
        <div
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 9999,
            pointerEvents: "auto",
          }}
        >
          <ExplorationBar
            percentage={stats?.percentage ?? 0}
            tilesDiscovered={stats?.tilesExplored ?? 0}
            totalTiles={stats?.totalTiles ?? 0}
            streakDays={stats?.streakDays ?? 0}
            level={stats?.level ?? 1}
            onPress={() => setHudOpen(v => !v)}
          />
        </div>
      )}

      {tab !== "stats" && (
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-5 z-20">
          <ProfileBar
            user={user}
            level={1}
            xpProgress={{ current: 42, next: 100 }}
            onPress={() => setTab("profile")}
          />
        </div>
      )}

      {/* Overlays/panels */}
      {overlays}

      {/* Stats overlay */}
      {(tab === "stats" || statsClosing) && (
        <div
          className={`stats-overlay fixed inset-0 z-30 overflow-y-auto ${statsClosing ? "stats-exit" : "stats-enter"}`}
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(28,233,253,0.18) transparent" }}
        >
          <style>{`
            .stats-overlay::-webkit-scrollbar { width: 4px; }
            .stats-overlay::-webkit-scrollbar-track { background: transparent; }
            .stats-overlay::-webkit-scrollbar-thumb { background: rgba(28,233,253,0.18); border-radius: 2px; }
            .stats-overlay::-webkit-scrollbar-thumb:hover { background: rgba(28,233,253,0.35); }
          `}</style>
          <StatsPage />
        </div>
      )}

      {/* X button — outside the animated div so fixed positioning works */}
      {tab === "stats" && !statsClosing && (
        <button
          type="button"
          onClick={closeStats}
          className="fixed top-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0F172A]/80 text-white/70 backdrop-blur-sm transition hover:bg-[#1a2540] hover:text-white"
          aria-label="Close stats"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      )}

      {/* Radial navigation button — hidden while any interface is open */}
      {tab === "map" && (
        <RadialNavButton
          activeTab={navTab}
          onTabChange={(t) => {
            setNavTab(t);
            if (t === "map") setTab("map");
            else if (t === "stats") setTab("stats");
            else if (t === "settings") setTab("profile");
          }}
        />
      )}
    </main>
  );
}
