"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CelebrationPopout } from "~/components/ui/CelebrationPopout";
import { ProfileBar } from "~/app/_components/profile/ProfileBar";
import SettingsPage from "~/app/_components/settings/SettingsPage";
import StatsPage from "~/app/_components/stats/StatsPage";
import { MapClient } from "~/app/map/MapClient";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import type { AppTab } from "./tab-nav";
import ExplorationBar from "~/app/_components/exploration/ExplorationBar";
import QuestsPage from "~/app/_components/quests/QuestsPage";
import { xpToLevel, xpProgress } from "~/lib/xp";
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
  const [darkMode, setDarkMode] = useState(true);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [fogIntensity, setFogIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');

  const statsQuery = api.map.getExplorationStats.useQuery({ cityId: "emory" });
  const xpQuery = api.quest.getXp.useQuery();
  const stats = statsQuery.data;
  const [, setHudOpen] = useState(true);
  const [statsClosing, setStatsClosing] = useState(false);
  const statsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [questsClosing, setQuestsClosing] = useState(false);
  const questsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settingsClosing, setSettingsClosing] = useState(false);
  const settingsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [celebration, setCelebration] = useState<{
    type?: "level" | "achievement" | "quest" | "nearby";
    title: string;
    shortText: string;
    message: string;
    submessage?: string;
  } | null>(null);

  const closeStats = useCallback(() => {
    setStatsClosing(true);
    statsCloseTimer.current = setTimeout(() => {
      setTab("map");
      setNavTab("map");
      setStatsClosing(false);
    }, 300);
  }, []);

  const closeQuests = useCallback(() => {
    setQuestsClosing(true);
    questsCloseTimer.current = setTimeout(() => {
      setTab("map");
      setNavTab("map");
      setQuestsClosing(false);
    }, 300);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsClosing(true);
    settingsCloseTimer.current = setTimeout(() => {
      setTab("map");
      setNavTab("map");
      setSettingsClosing(false);
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

useEffect(() => {
  setCelebration({
    type: "achievement",
    title: "First Steps",
    shortText: "Achievement Unlocked",
    message: "You explored your first area.",
  });
}, []);

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

          <p className="mt-4 text-center text-[10px] text-white/25">
            Icon by{" "}
            <a
              href="https://icons8.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/40"
            >
              Icons8
            </a>
          </p>
        </div>
      </div>
    );
  }, [signOut, signingOut, tab, user.imageUrl, user.name]);

  return (
    <main className="relative min-h-[100dvh] bg-[#0b1020] text-white">
      {/* Map stays mounted regardless of tab */}
      <MapClient user={user} fogIntensity={fogIntensity} />

      {tab !== "stats" && tab !== "quests" && tab !== "settings" && (
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
            tilesDiscovered={stats?.tilesDiscovered ?? 0}
            totalTiles={stats?.totalTiles ?? 0}
            streakDays={stats?.streakDays ?? 0}
            onPress={() => setHudOpen(v => !v)}
          />
        </div>
      )}

      {tab !== "stats" && tab !== "quests" && (
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-5 z-20">
          <ProfileBar
            user={user}
            level={xpToLevel(xpQuery.data?.xp ?? 0)}
            xpProgress={xpProgress(xpQuery.data?.xp ?? 0)}
            onPress={() => setTab("profile")}
          />
        </div>
      )}

      {/* Overlays/panels */}
      {overlays}

      {/* Stats overlay */}
      {(tab === "stats" || statsClosing) && (
        <div
          className="stats-overlay fixed inset-0 z-30 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(28,233,253,0.18) transparent",
            animation: statsClosing
              ? "stats-slide-down 0.3s cubic-bezier(0.32,0.72,0,1) forwards"
              : "stats-slide-up 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
          }}
        >
          <style>{`
            @keyframes stats-slide-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes stats-slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }
            .stats-overlay::-webkit-scrollbar { width: 4px; }
            .stats-overlay::-webkit-scrollbar-track { background: transparent; }
            .stats-overlay::-webkit-scrollbar-thumb { background: rgba(28,233,253,0.18); border-radius: 2px; }
            .stats-overlay::-webkit-scrollbar-thumb:hover { background: rgba(28,233,253,0.35); }
          `}</style>
          <StatsPage darkMode={darkMode} units={units} />
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

      {/* Quests overlay */}
      {(tab === "quests" || questsClosing) && (
        <div
          className="quests-overlay fixed inset-0 z-30 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(28,233,253,0.18) transparent",
            animation: questsClosing
              ? "quests-slide-down 0.3s cubic-bezier(0.32,0.72,0,1) forwards"
              : "quests-slide-up 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
          }}
        >
          <style>{`
            @keyframes quests-slide-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes quests-slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }
            .quests-overlay::-webkit-scrollbar { width: 4px; }
            .quests-overlay::-webkit-scrollbar-track { background: transparent; }
            .quests-overlay::-webkit-scrollbar-thumb { background: rgba(28,233,253,0.18); border-radius: 2px; }
            .quests-overlay::-webkit-scrollbar-thumb:hover { background: rgba(28,233,253,0.35); }
          `}</style>
          <QuestsPage darkMode={darkMode} />
        </div>
      )}

      {/* X button for quests */}
      {tab === "quests" && !questsClosing && (
        <button
          type="button"
          onClick={closeQuests}
          className="fixed top-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0F172A]/80 text-white/70 backdrop-blur-sm transition hover:bg-[#1a2540] hover:text-white"
          aria-label="Close quests"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      )}

      {/* Settings overlay */}
      {(tab === "settings" || settingsClosing) && (
        <div
          className="settings-overlay fixed inset-0 z-30 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(28,233,253,0.18) transparent",
            animation: settingsClosing
              ? "settings-slide-down 0.3s cubic-bezier(0.32,0.72,0,1) forwards"
              : "settings-slide-up 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
          }}
        >
          <style>{`
            @keyframes settings-slide-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes settings-slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }
            .settings-overlay::-webkit-scrollbar { width: 4px; }
            .settings-overlay::-webkit-scrollbar-track { background: transparent; }
            .settings-overlay::-webkit-scrollbar-thumb { background: rgba(28,233,253,0.18); border-radius: 2px; }
            .settings-overlay::-webkit-scrollbar-thumb:hover { background: rgba(28,233,253,0.35); }
          `}</style>
          <SettingsPage onSignOut={signOut} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(v => !v)} units={units} onChangeUnits={setUnits} fogIntensity={fogIntensity} onChangeFogIntensity={setFogIntensity} />
        </div>
      )}

      {/* X button for settings */}
      {tab === "settings" && !settingsClosing && (
        <button
          type="button"
          onClick={closeSettings}
          className="fixed top-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0F172A]/80 text-white/70 backdrop-blur-sm transition hover:bg-[#1a2540] hover:text-white"
          aria-label="Close settings"
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
            else if (t === "quests") setTab("quests");
            else if (t === "stats") setTab("stats");
            else if (t === "settings") setTab("settings");
          }}
        />
      )}
  <CelebrationPopout
    open={!!celebration}
    type={celebration?.type}
    title={celebration?.title ?? ""}
    shortText={celebration?.shortText ?? ""}
    message={celebration?.message ?? ""}
    onClose={() => setCelebration(null)}
  />

    </main>
  );
}
