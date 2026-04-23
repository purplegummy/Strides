"use client";

import { useState } from "react";
import { Trophy, Map, ScrollText } from "lucide-react";
import { api } from "~/trpc/react";
import { xpToLevel } from "~/lib/xp";

type SortKey = "xp" | "tiles" | "quests";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: "xp", label: "XP", icon: Trophy },
  { key: "tiles", label: "Explorer", icon: Map },
  { key: "quests", label: "Quests", icon: ScrollText },
];

const MEDAL_STYLES = [
  "from-[#FFD700] to-[#e6a817] text-[#7a5000] shadow-[0_0_12px_rgba(255,215,0,0.4)]",
  "from-[#D4D4D4] to-[#a8a8a8] text-[#444] shadow-[0_0_8px_rgba(200,200,200,0.3)]",
  "from-[#CD7F32] to-[#a0522d] text-[#5a2a00] shadow-[0_0_8px_rgba(205,127,50,0.3)]",
];

function Avatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (image?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }

  const colors = [
    "bg-[#1d4ed8]", "bg-[#0891b2]", "bg-[#059669]",
    "bg-[#d97706]", "bg-[#dc2626]", "bg-[#7c3aed]",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={`${colors[colorIndex]} flex items-center justify-center rounded-full text-white font-bold`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export default function LeaderboardPage({ darkMode = true }: { darkMode?: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>("xp");
  const query = api.leaderboard.getLeaderboard.useQuery();

  const t = darkMode
    ? {
        page: "bg-[#0a1628] text-white",
        heading: "text-white",
        subheading: "text-[#6b7c95]",
        card: "bg-[#0f1e35] border-[#1e3050]",
        cardHighlight: "bg-[#0d2240] border-[#1e4080]",
        text: "text-white",
        muted: "text-[#6b7c95]",
        dimmed: "text-[#3d4f6b]",
        barBg: "bg-[#1e3050]",
        divider: "border-[#1e3050]",
        tabActive: "bg-[#1e3050] text-[#00d9ff] border border-[#00d9ff]/30",
        tabInactive: "text-[#6b7c95] hover:text-white",
        rankBg: "bg-[#1e3050] text-[#6b7c95]",
        badge: "bg-[#1e3050] text-[#00d9ff]",
      }
    : {
        page: "bg-[#f8fafc] text-gray-900",
        heading: "text-gray-900",
        subheading: "text-gray-500",
        card: "bg-white border-gray-200",
        cardHighlight: "bg-blue-50 border-blue-300",
        text: "text-gray-900",
        muted: "text-gray-500",
        dimmed: "text-gray-400",
        barBg: "bg-gray-200",
        divider: "border-gray-200",
        tabActive: "bg-gray-100 text-blue-600 border border-blue-300",
        tabInactive: "text-gray-500 hover:text-gray-900",
        rankBg: "bg-gray-100 text-gray-500",
        badge: "bg-blue-50 text-blue-600",
      };

  const entries = query.data ?? [];
  const sorted = [...entries].sort((a, b) => {
    if (sortKey === "xp") return b.xp - a.xp;
    if (sortKey === "tiles") return b.tilesDiscovered - a.tilesDiscovered;
    return b.questsCompleted - a.questsCompleted;
  });

  const getValue = (entry: (typeof sorted)[0]) => {
    if (sortKey === "xp") return entry.xp;
    if (sortKey === "tiles") return entry.tilesDiscovered;
    return entry.questsCompleted;
  };

  const getValueLabel = (entry: (typeof sorted)[0]) => {
    if (sortKey === "xp") return `${entry.xp} XP`;
    if (sortKey === "tiles") return `${entry.tilesDiscovered} tiles`;
    return `${entry.questsCompleted} quests`;
  };

  const maxValue = sorted.length > 0 ? Math.max(getValue(sorted[0]!), 1) : 1;

  const currentUserRank = sorted.findIndex((e) => e.isCurrentUser) + 1;

  return (
    <div className={`min-h-screen ${t.page} p-6`}>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#e6a817] shadow-[0_0_16px_rgba(255,215,0,0.35)]">
              <Trophy size={20} className="text-[#7a5000]" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${t.heading}`}>Leaderboard</h1>
              <p className={`text-sm ${t.subheading}`}>Emory University Campus</p>
            </div>
          </div>

          {currentUserRank > 0 && (
            <div className={`mt-4 rounded-xl border px-4 py-3 ${t.cardHighlight}`}>
              <span className={`text-sm font-semibold ${t.text}`}>
                You are ranked{" "}
                <span className="text-[#00d9ff]">#{currentUserRank}</span>
                {" "}of {sorted.length} explorers
              </span>
            </div>
          )}
        </div>

        {/* Sort tabs */}
        <div className="mb-6 flex gap-2">
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              className={[
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                sortKey === key ? t.tabActive : t.tabInactive,
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Podium (top 3) */}
        {sorted.length >= 3 && (
          <div className="mb-6 flex items-end justify-center gap-3">
            {[sorted[1], sorted[0], sorted[2]].map((entry, podiumIdx) => {
              if (!entry) return null;
              const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
              const heights = ["h-20", "h-28", "h-16"];
              const medalStyle = MEDAL_STYLES[rank - 1]!;
              return (
                <div key={entry.id} className="flex flex-col items-center gap-2">
                  <Avatar name={entry.name} image={entry.image} size={rank === 1 ? 48 : 40} />
                  <span className={`max-w-[80px] truncate text-center text-xs font-semibold ${entry.isCurrentUser ? "text-[#00d9ff]" : t.text}`}>
                    {entry.name.split(" ")[0]}
                  </span>
                  <div
                    className={`flex w-20 flex-col items-center justify-end rounded-t-xl bg-gradient-to-b ${medalStyle} ${heights[podiumIdx]}`}
                  >
                    <span className="mb-2 text-lg font-black">#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full rankings list */}
        {query.isLoading ? (
          <div className={`rounded-2xl border p-8 text-center ${t.card}`}>
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#00d9ff] border-t-transparent" />
            <p className={`text-sm ${t.muted}`}>Loading rankings…</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${t.card}`}>
            <p className={t.muted}>No explorers yet. Be the first!</p>
          </div>
        ) : (
          <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
            {sorted.map((entry, index) => {
              const rank = index + 1;
              const value = getValue(entry);
              const barPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const isMedal = rank <= 3;
              const medalStyle = isMedal ? MEDAL_STYLES[rank - 1] : null;

              return (
                <div
                  key={entry.id}
                  className={[
                    "flex items-center gap-4 px-5 py-4 transition-colors",
                    index !== sorted.length - 1 ? `border-b ${t.divider}` : "",
                    entry.isCurrentUser ? t.cardHighlight : "",
                  ].join(" ")}
                >
                  {/* Rank */}
                  <div className="w-8 shrink-0 text-center">
                    {isMedal ? (
                      <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-xs font-black ${medalStyle}`}>
                        {rank}
                      </div>
                    ) : (
                      <span className={`text-sm font-semibold ${t.dimmed}`}>#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar name={entry.name} image={entry.image} size={36} />

                  {/* Name + bar */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`truncate text-sm font-semibold ${entry.isCurrentUser ? "text-[#00d9ff]" : t.text}`}>
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.badge}`}>
                            you
                          </span>
                        )}
                      </span>
                      <span className={`shrink-0 text-xs ${t.dimmed}`}>
                        Lv.{xpToLevel(entry.xp)}
                      </span>
                    </div>
                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${t.barBg}`}>
                      <div
                        className="h-full rounded-full bg-[#00d9ff] transition-all duration-700 ease-out"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="shrink-0 text-right">
                    <span className={`text-sm font-bold ${t.text}`}>{getValueLabel(entry)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
