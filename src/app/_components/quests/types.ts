export type QuestDifficulty = "easy" | "medium" | "hard" | "legendary";
export type QuestCategory = "exploration" | "social" | "challenge" | "daily";
export type QuestStatus = "locked" | "available" | "active" | "completed";

export interface QuestObjective {
  id: string;
  description: string;
  /** live current progress — injected at runtime, not stored in quest definitions */
  current: number;
  target: number;
  unit: string;
}

/** Static quest definition — no live data here */
export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  lore?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  icon?: string;
  objectives: Omit<QuestObjective, "current">[];
  reward: { xp: number; label?: string };
  /** If true, shows a collect button that awards XP once */
  collectible?: boolean;
  /** If set, the objective with id matching this is a location visit check */
  location?: { lat: number; lng: number; radiusM: number; name?: string };
}

/** Quest with live progress injected */
export interface Quest extends Omit<QuestDefinition, "objectives"> {
  status: QuestStatus;
  objectives: QuestObjective[];
}
