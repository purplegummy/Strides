// ─── Pin Rarity System ────────────────────────────────────────────────────────
// Upvote thresholds → rarity tier

export type PinRarity = "common" | "notable" | "popular" | "rare" | "legendary";

export const RARITY_THRESHOLDS: { min: number; rarity: PinRarity }[] = [
  { min: 0,  rarity: "common"    },
  { min: 3,  rarity: "notable"   },
  { min: 10, rarity: "popular"   },
  { min: 25, rarity: "rare"      },
  { min: 50, rarity: "legendary" },
];

export function getRarity(upvotes: number): PinRarity {
  const tier = [...RARITY_THRESHOLDS].reverse().find((t) => upvotes >= t.min);
  return tier?.rarity ?? "common";
}

export const RARITY_CONFIG: Record<
  PinRarity,
  { label: string; color: string; glow: string; ring: string; dot: string; emoji: string }
> = {
  common:    { label: "Common",    color: "#8899aa", glow: "rgba(136,153,170,0.35)", ring: "#8899aa", dot: "#8899aa", emoji: "⬜" },
  notable:   { label: "Notable",   color: "#4ade80", glow: "rgba(74,222,128,0.40)",  ring: "#4ade80", dot: "#4ade80", emoji: "🟩" },
  popular:   { label: "Popular",   color: "#38bdf8", glow: "rgba(56,189,248,0.45)",  ring: "#38bdf8", dot: "#38bdf8", emoji: "🟦" },
  rare:      { label: "Rare",      color: "#a78bfa", glow: "rgba(167,139,250,0.50)", ring: "#a78bfa", dot: "#a78bfa", emoji: "🟪" },
  legendary: { label: "Legendary", color: "#fbbf24", glow: "rgba(251,191,36,0.60)",  ring: "#fbbf24", dot: "#fbbf24", emoji: "🟨" },
};