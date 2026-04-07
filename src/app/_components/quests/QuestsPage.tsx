"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { api } from "~/trpc/react";
import type { Quest, QuestObjective } from "./types";
import { QUEST_DEFINITIONS } from "./questData";

function objectiveProgress(obj: QuestObjective) {
  return Math.min(obj.current / obj.target, 1);
}

function totalProgress(quest: Quest) {
  if (quest.objectives.length === 0) return 0;
  return quest.objectives.reduce((acc, o) => acc + objectiveProgress(o), 0) / quest.objectives.length;
}

function QuestCard({ quest, collected, darkMode }: { quest: Quest; collected: boolean; darkMode: boolean }) {
  const hasObjectives = quest.objectives.length > 0;
  const pct = hasObjectives ? totalProgress(quest) : 1;
  const allObjectivesDone = !hasObjectives || pct >= 1;
  const [optimisticCollected, setOptimisticCollected] = useState(false);
  const utils = api.useUtils();

  const collect = api.quest.collectReward.useMutation({
    onSuccess: () => {
      void utils.quest.getCompletedQuests.invalidate();
      void utils.quest.getXp.invalidate();
    },
  });

  const isCollected = collected || optimisticCollected;

  const cardBg = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cardBorder = darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)";
  const mutedColor = darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
  const xpColor = darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)";
  const trackBg = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const titleColor = darkMode ? undefined : "rgb(17,24,39)";

  return (
    <div className="space-y-3 rounded-xl p-4" style={{ background: cardBg, border: cardBorder }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={titleColor ? { color: titleColor } : undefined}>
            {quest.icon && <span className="mr-1.5">{quest.icon}</span>}{quest.title}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{quest.description}</p>
        </div>
        <span className="shrink-0 text-xs" style={{ color: xpColor }}>{quest.reward.xp} XP</span>
      </div>

      {quest.objectives.map(obj => {
        const done = objectiveProgress(obj) >= 1;
        return (
          <div key={obj.id} className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: mutedColor }}>
              <span>{obj.description}</span>
              <span className="tabular-nums">{Math.min(obj.current, obj.target)} / {obj.target} {obj.unit}</span>
            </div>
            <div className="h-0.5 w-full overflow-hidden rounded-full" style={{ background: trackBg }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct * 100}%`, background: done ? "#4ade80" : "#1CE9FD" }}
              />
            </div>
          </div>
        );
      })}

      {!hasObjectives && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs" style={{ color: mutedColor }}>
            <span>Ready to collect</span>
          </div>
          <div className="h-0.5 w-full overflow-hidden rounded-full" style={{ background: trackBg }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: "100%", background: collected ? (darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") : "#1CE9FD" }}
            />
          </div>
        </div>
      )}

      {quest.collectible && (
        <button
          type="button"
          disabled={isCollected || !allObjectivesDone}
          onClick={() => {
            setOptimisticCollected(true);
            collect.mutate({ questId: quest.id });
          }}
          className="w-full rounded-lg py-2 text-xs font-semibold transition"
          style={{
            background: isCollected || !allObjectivesDone
              ? (darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")
              : "rgba(28,233,253,0.12)",
            color: isCollected || !allObjectivesDone
              ? (darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)")
              : "#1CE9FD",
            border: `1px solid ${isCollected || !allObjectivesDone
              ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)")
              : "rgba(28,233,253,0.2)"}`,
            cursor: isCollected || !allObjectivesDone ? "default" : "pointer",
          }}
        >
          {isCollected ? "Collected" : !allObjectivesDone ? "Complete objectives first" : `Collect ${quest.reward.xp} XP`}
        </button>
      )}
    </div>
  );
}

function CollapsibleSection({ label, count, defaultOpen = true, darkMode, children }: {
  label: string;
  count: number;
  defaultOpen?: boolean;
  darkMode: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const labelColor = darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)";
  const badgeBg = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const badgeColor = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";
  const chevronColor = darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)";

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between py-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: labelColor }}>
            {label}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {count}
          </span>
        </div>
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ color: chevronColor, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
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

  if (completedQuery.isPending) return null;

  const collectedIds = new Set(completedQuery.data?.map(c => c.questId) ?? []);

  const quests: Quest[] = QUEST_DEFINITIONS.map(def => ({
    ...def,
    status: "active" as const,
    objectives: def.objectives.map(obj => ({
      ...obj,
      current: obj.id === "tiles" ? tilesDiscovered : obj.id === "pins" ? pinsPlaced : 0,
    })),
  }));

  const activeQuests = quests.filter(q => !collectedIds.has(q.id));
  const completedQuests = quests.filter(q => collectedIds.has(q.id));

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0b1020] text-[#E6EDF7]' : 'bg-[#f8fafc] text-gray-900'}`}>
      <div className="mx-auto max-w-lg px-4 pb-32 pt-16">
        <h1 className="mb-6 text-xl font-bold">Quests</h1>

        {activeQuests.length > 0 && (
          <CollapsibleSection label="Active" count={activeQuests.length} darkMode={darkMode}>
            {activeQuests.map(q => <QuestCard key={q.id} quest={q} collected={false} darkMode={darkMode} />)}
          </CollapsibleSection>
        )}

        {completedQuests.length > 0 && (
          <CollapsibleSection label="Completed" count={completedQuests.length} defaultOpen={false} darkMode={darkMode}>
            {completedQuests.map(q => <QuestCard key={q.id} quest={q} collected={true} darkMode={darkMode} />)}
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
