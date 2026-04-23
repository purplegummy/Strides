"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import { CelebrationPopout } from "~/components/ui/CelebrationPopout";
import { ProfileBar } from "~/app/_components/profile/ProfileBar";
import { ProfilePopup } from "~/app/_components/profile/profile-popup";
import SettingsPage from "~/app/_components/settings/SettingsPage";
import StatsPage from "~/app/_components/stats/StatsPage";
import QuestsPage from "~/app/_components/quests/QuestsPage";
import { MapClient } from "~/app/map/MapClient";
import LeaderboardPage from "~/app/_components/leaderboard/LeaderboardPage";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import type { AppTab } from "./tab-nav";
import ExplorationBar from "~/app/_components/exploration/ExplorationBar";
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
  const [leaderboardClosing, setLeaderboardClosing] = useState(false);
  const leaderboardCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const closeLeaderboard = useCallback(() => {
    setLeaderboardClosing(true);
    leaderboardCloseTimer.current = setTimeout(() => {
      setTab("map");
      setNavTab("map");
      setLeaderboardClosing(false);
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
      <div className="absolute inset-0 z-20 overflow-y-auto bg-[#0b1020]/95 p-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setTab("map")}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            Back to map
          </button>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <ProfilePopup
            user={{
              name: user.name,
              image: user.imageUrl,
            }}
            onSignOut={signOut}
          />
        </div>
      </div>
    );
  }, [signOut, tab, user.imageUrl, user.name]);

  return (
    <main className="relative min-h-[100dvh] bg-[#0b1020] text-white">
      <Toaster position="top-center" theme="dark" richColors />
      {/* Map stays mounted regardless of tab */}
      <MapClient user={user} fogIntensity={fogIntensity} hideControls={tab === "profile"} />

      {tab !== "stats" && tab !== "quests" && tab !== "settings" && tab !== "profile" && tab !== "leaderboard" && (
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
            level={xpToLevel(xpQuery.data?.xp ?? 0)}
            onPress={() => { setTab("stats"); setNavTab("stats"); }}
          />
        </div>
      )}

      {tab !== "stats" && tab !== "quests" && tab !== "leaderboard" && tab !== "profile" && (
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-5 z-20">
          <ProfileBar
            user={user}
            level={xpToLevel(xpQuery.data?.xp ?? 0)}
            xpProgress={xpProgress(xpQuery.data?.xp ?? 0)}
            onPress={() => setTab("profile")}
          />
        </div>
      )}

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

      {/* Leaderboard overlay */}
      {(tab === "leaderboard" || leaderboardClosing) && (
        <div
          className="leaderboard-overlay fixed inset-0 z-30 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(28,233,253,0.18) transparent",
            animation: leaderboardClosing
              ? "leaderboard-slide-down 0.3s cubic-bezier(0.32,0.72,0,1) forwards"
              : "leaderboard-slide-up 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
          }}
        >
          <style>{`
            @keyframes leaderboard-slide-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes leaderboard-slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }
            .leaderboard-overlay::-webkit-scrollbar { width: 4px; }
            .leaderboard-overlay::-webkit-scrollbar-track { background: transparent; }
            .leaderboard-overlay::-webkit-scrollbar-thumb { background: rgba(28,233,253,0.18); border-radius: 2px; }
            .leaderboard-overlay::-webkit-scrollbar-thumb:hover { background: rgba(28,233,253,0.35); }
          `}</style>
              <LeaderboardPage darkMode={darkMode} />
        </div>
      )}

      {tab === "leaderboard" && !leaderboardClosing && (
        <button
          type="button"
          onClick={closeLeaderboard}
          className="fixed top-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0F172A]/80 text-white/70 backdrop-blur-sm transition hover:bg-[#1a2540] hover:text-white"
          aria-label="Close leaderboard"
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
            else if (t === "leaderboard") setTab("leaderboard");
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
