import type { QuestDefinition } from "./types";

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "first-pin",
    title: "Drop Your First Pin",
    description: "Mark a spot on Emory Campus and share it with others.",
    category: "social",
    difficulty: "easy",
    icon: "📍",
    objectives: [
      {
        id: "pins",
        description: "Drop a pin on the map",
        target: 1,
        unit: "pins",
      },
    ],
    reward: { xp: 75, label: "75 XP" },
    collectible: true,
  },
  {
    id: "first-steps",
    title: "First Steps",
    description: "Take your first steps and uncover a piece of Emory Campus.",
    category: "exploration",
    difficulty: "easy",
    icon: "👣",
    objectives: [
      {
        id: "tiles",
        description: "Explore a tile on Emory Campus",
        target: 1,
        unit: "tiles",
      },
    ],
    reward: {
      xp: 50,
      label: "50 XP",
    },
    collectible: true,
  },
  {
    id: "emory-scout",
    title: "Emory Scout",
    description: "Explore Emory Campus and reveal what lies beyond the fog.",
    lore: "The ancient cartographers say: a map unwalked is a map unfinished.",
    category: "exploration",
    difficulty: "easy",
    icon: "🗺️",
    objectives: [
      {
        id: "tiles",
        description: "Explore tiles on Emory Campus",
        target: 10,
        unit: "tiles",
      },
    ],
    reward: {
      xp: 250,
      label: "250 XP",
    },
    collectible: true,
  },
];
