import type { QuestDefinition } from "./types";

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "collect-test",
    title: "First Reward",
    description: "Test the reward collection system.",
    category: "challenge",
    difficulty: "easy",
    icon: "🎁",
    objectives: [],
    reward: { xp: 50, label: "50 XP" },
    collectible: true,
  },
  {
    id: "city-scout",
    title: "City Scout",
    description: "Start your journey by uncovering the streets of your city.",
    lore: "The ancient cartographers say: a map unwalked is a map unfinished.",
    category: "exploration",
    difficulty: "easy",
    icon: "🗺️",
    objectives: [
      {
        id: "tiles",
        description: "Explore tiles in your city",
        target: 10,
        unit: "tiles",
      },
    ],
    reward: {
      xp: 250,
      label: "250 XP + Scout Badge",
    },
  },
];
