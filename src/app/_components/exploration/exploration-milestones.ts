export interface Milestone {
  pct: number;
  label: string;
  icon: string;
}

/** Ordered thresholds that unlock rank titles as exploration % climbs. */
export const MILESTONES: Milestone[] = [
  { pct: 5,   label: "Scout",       icon: "🌱" },
  { pct: 15,  label: "Wanderer",    icon: "🥾" },
  { pct: 30,  label: "Explorer",    icon: "🧭" },
  { pct: 50,  label: "Pathfinder",  icon: "🗺️" },
  { pct: 75,  label: "Trailblazer", icon: "⚡" },
  { pct: 100, label: "Legend",      icon: "🏆" },
];

/** Returns the highest milestone the user has reached, or "Newcomer" at 0%. */
export function getCurrentMilestone(pct: number): Milestone {
  const achieved = MILESTONES.filter((m) => pct >= m.pct);
  return achieved[achieved.length - 1] ?? { pct: 0, label: "Newcomer", icon: "👣" };
}

/** Returns the next milestone to reach, or null if already at 100%. */
export function getNextMilestone(pct: number): Milestone | null {
  return MILESTONES.find((m) => pct < m.pct) ?? null;
}
