"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { api } from "~/trpc/react";
import type { Quest, QuestObjective } from "./types";
import { QUEST_DEFINITIONS } from "./questData";

function objectiveProgress(obj: QuestObjective) {
  return Math.min(obj.current / obj.target, 1);
}

const darkTheme = {
  page: "bg-[#0a1628] text-white",
  heading: "text-white",
  sectionLabel: "text-[#6b7c95]",
  card: "bg-[#0f1e35] border-[#1e3050]",
  text: "text-white",
  muted: "text-[#6b7c95]",
  barBg: "bg-[#1e3050]",
  iconBg: "bg-[#1e3050]",
  divider: "border-[#1e3050]",
  badgeBg: "bg-[#1e3050]",
  badgeText: "text-[#6b7c95]",
  xpColor: "text-[#3d4f6b]",
  collectedFill: "rgba(255,255,255,0.15)",
};

const lightTheme = {
  page: "bg-[#f8fafc] text-gray-900",
  heading: "text-gray-900",
  sectionLabel: "text-gray-500",
  card: "bg-white border-gray-200",
  text: "text-gray-900",
  muted: "text-gray-500",
  barBg: "bg-gray-200",
  iconBg: "bg-gray-100",
  divider: "border-gray-200",
  badgeBg: "bg-gray-100",
  badgeText: "text-gray-500",
  xpColor: "text-gray-400",
  collectedFill: "rgba(0,0,0,0.1)",
};

type Theme = typeof darkTheme;

function QuestCard({ quest, collected, t }: { quest: Quest; collected: boolean; t: Theme }) {
  const hasObjectives = quest.objectives.length > 0;
  const allObjectivesDone = !hasObjectives || quest.objectives.every(obj => objectiveProgress(obj) >= 1);
  const utils = api.useUtils();

  const collect = api.quest.collectReward.useMutation({
    onSuccess: () => {
      void utils.quest.getCompletedQuests.invalidate();
      void utils.quest.getXp.invalidate();
    },
  });

  return (
    <div className={`space-y-4 rounded-2xl p-5 border ${t.card}`}>
      <div className="flex items-start gap-4">
        {quest.icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${t.iconBg}`}>
            {quest.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${t.text}`}>{quest.title}</p>
            <span className={`shrink-0 text-xs font-medium ${t.xpColor}`}>{quest.reward.xp} XP</span>
          </div>
          <p className={`mt-0.5 text-xs ${t.muted}`}>{quest.description}</p>
        </div>
      </div>

      {quest.objectives.map(obj => {
        const pct = objectiveProgress(obj);
        return (
          <div key={obj.id} className="space-y-1.5">
            <div className={`flex justify-between text-xs ${t.muted}`}>
              <span>{obj.description}</span>
              <span className="tabular-nums">{Math.min(obj.current, obj.target)} / {obj.target} {obj.unit}</span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${t.barBg}`}>
              <div
                className="h-full bg-[#00d9ff] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>
        );
      })}

      {!hasObjectives && (
        <div className="space-y-1.5">
          <p className={`text-xs ${t.muted}`}>Ready to collect</p>
          <div className={`w-full rounded-full h-2 overflow-hidden ${t.barBg}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${collected ? "" : "bg-[#00d9ff]"}`}
              style={{ width: "100%", background: collected ? t.collectedFill : undefined }}
            />
          </div>
        </div>
      )}

      {quest.collectible && (
        <button
          type="button"
          disabled={collected || !allObjectivesDone || collect.isPending}
          onClick={() => collect.mutate({ questId: quest.id })}
          className={`w-full rounded-xl py-2.5 text-xs font-semibold transition ${
            collected || !allObjectivesDone
              ? `${t.barBg} ${t.xpColor} border ${t.divider} cursor-default`
              : "bg-[#00d9ff]/10 text-[#00d9ff] border border-[#00d9ff]/20 hover:bg-[#00d9ff]/20"
          }`}
        >
          {collected ? "Collected" : !allObjectivesDone ? "Complete objectives first" : `Collect ${quest.reward.xp} XP`}
        </button>
      )}
    </div>
  );
}

function CollapsibleSection({ label, count, defaultOpen = true, t, children }: {
  label: string;
  count: number;
  defaultOpen?: boolean;
  t: Theme;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between py-2 mb-1"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${t.sectionLabel}`}>
            {label}
          </span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${t.badgeBg} ${t.badgeText}`}>
            {count}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${t.sectionLabel}`}
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>

      {open && <div className="space-y-3">{children}</div>}
    </section>
  );
}

export default function QuestsPage({ darkMode = true }: { darkMode?: boolean }) {
  const statsQuery = api.map.getExplorationStats.useQuery({ cityId: "emory" });
  const fullStatsQuery = api.map.getStats.useQuery();
  const completedQuery = api.quest.getCompletedQuests.useQuery();
  const tilesDiscovered = statsQuery.data?.tilesDiscovered ?? 0;
  const pinsPlaced = fullStatsQuery.data?.pinsPlaced ?? 0;
  const visitedLocationIds = new Set(fullStatsQuery.data?.visitedLocationIds ?? []);

  const t = darkMode ? darkTheme : lightTheme;

  if (completedQuery.isPending) return null;

  const collectedIds = new Set(completedQuery.data?.map(c => c.questId) ?? []);

  const quests: Quest[] = QUEST_DEFINITIONS.map(def => ({
    ...def,
    status: "active" as const,
    objectives: def.objectives.map(obj => ({
      ...obj,
      current: obj.id === "tiles" ? tilesDiscovered
        : obj.id === "pins" ? pinsPlaced
        : obj.id === "location" ? (visitedLocationIds.has(def.id) ? 1 : 0)
        : 0,
    })),
  }));

  const activeQuests = quests.filter(q => !collectedIds.has(q.id));
  const completedQuests = quests.filter(q => collectedIds.has(q.id));

  return (
    <div className={`min-h-screen ${t.page}`}>
      <div className="max-w-lg mx-auto px-6 py-8 pb-32">
        <div className="mb-8">
          <h1 className={`text-[32px] font-bold ${t.heading}`}>Quests</h1>
        </div>

        {activeQuests.length > 0 && (
          <CollapsibleSection label="Active" count={activeQuests.length} t={t}>
            {activeQuests.map(q => <QuestCard key={q.id} quest={q} collected={false} t={t} />)}
          </CollapsibleSection>
        )}

        {completedQuests.length > 0 && (
          <CollapsibleSection label="Completed" count={completedQuests.length} defaultOpen={false} t={t}>
            {completedQuests.map(q => <QuestCard key={q.id} quest={q} collected={true} t={t} />)}
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
