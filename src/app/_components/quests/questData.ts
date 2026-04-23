import type { QuestDefinition } from "./types";

export type LocationMarker = {
  id: string;
  icon: string;
  location: { lat: number; lng: number; name: string };
};

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
    id: "woodruff-visit",
    title: "Hit the Gym",
    description: "Make your way to the Woodruff PE Center.",
    lore: "Every explorer needs a base. Yours has a climbing wall.",
    category: "exploration",
    difficulty: "easy",
    icon: "🏋️",
    objectives: [
      {
        id: "location",
        description: "Visit Woodruff PE Center",
        target: 1,
        unit: "visit",
      },
    ],
    reward: { xp: 100, label: "100 XP" },
    collectible: true,
    location: { lat: 33.793311, lng: -84.325104, radiusM: 75, name: "Woodruff PE Center" },
  },
  {
    id: "white-hall-visit",
    title: "Lecture Hall Legend",
    description: "Find your way to White Hall.",
    lore: "Many have sat in these seats. Few have truly been present.",
    category: "exploration",
    difficulty: "easy",
    icon: "🎓",
    objectives: [
      {
        id: "location",
        description: "Visit White Hall",
        target: 1,
        unit: "visit",
      },
    ],
    reward: { xp: 100, label: "100 XP" },
    collectible: true,
    location: { lat: 33.790755, lng: -84.325904, radiusM: 40, name: "White Hall" },
  },
  {
    id: "msc-visit",
    title: "Science Side of Campus",
    description: "Check out the Math and Science Center.",
    lore: "All the best discoveries happen here. Or so they claim.",
    category: "exploration",
    difficulty: "easy",
    icon: "🔬",
    objectives: [
      {
        id: "location",
        description: "Visit Math and Science Center",
        target: 1,
        unit: "visit",
      },
    ],
    reward: { xp: 100, label: "100 XP" },
    collectible: true,
    location: { lat: 33.790170, lng: -84.326702, radiusM: 50, name: "Math & Science Center" },
  },
  {
    id: "first-upvote",
    title: "Good Taste",
    description: "Upvote a pin someone else left on the map.",
    lore: "Every great explorer appreciates the work of others.",
    category: "social",
    difficulty: "easy",
    icon: "👍",
    objectives: [
      {
        id: "upvotes_given",
        description: "Upvote a pin",
        target: 1,
        unit: "upvotes",
      },
    ],
    reward: { xp: 75, label: "75 XP" },
    collectible: true,
  },
  {
    id: "short-walk",
    title: "Just Getting Started",
    description: "Walk 0.1 km on Emory Campus.",
    lore: "Every journey begins with a single step.",
    category: "exploration",
    difficulty: "easy",
    icon: "🚶",
    objectives: [
      {
        id: "distance",
        description: "Walk on campus",
        target: 0.1,
        unit: "km",
      },
    ],
    reward: { xp: 100, label: "100 XP" },
    collectible: true,
  },
  {
    id: "top-of-the-world",
    title: "Top of the World",
    description: "Reach #1 on the leaderboard.",
    lore: "There can only be one. The fog bows to those who conquer it all.",
    category: "challenge",
    difficulty: "legendary",
    icon: "👑",
    objectives: [
      {
        id: "leaderboard_rank_1",
        description: "Reach rank #1 on the Explorer leaderboard",
        target: 1,
        unit: "rank",
      },
    ],
    reward: { xp: 500, label: "500 XP" },
    collectible: true,
  },
  {
    id: "influencer",
    title: "Influencer",
    description: "Drop pins worth talking about. Get 10 upvotes across all your pins.",
    lore: "The best explorers don't just find places — they make others want to visit them.",
    category: "social",
    difficulty: "medium",
    icon: "🌟",
    objectives: [
      {
        id: "upvotes_received",
        description: "Receive upvotes on your pins",
        target: 10,
        unit: "upvotes",
      },
    ],
    reward: { xp: 300, label: "300 XP" },
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

/** Standalone map markers not yet tied to a quest */
export const LOCATION_MARKERS: LocationMarker[] = [
  {
    id: "the-quad",
    icon: "🌳",
    location: { lat: 33.79073039369105, lng: -84.32449262890229, name: "The Quad" },
  },
  {
    id: "mcdonough-field",
    icon: "🎫",
    location: { lat: 33.794067540034035, lng: -84.32508053559074, name: "McDonough Field" },
  },
  {
    id: "cox-hall",
    icon: "🖥️",
    location: { lat: 33.792301468700124, lng: -84.32334799620519, name: "Cox Hall" },
  },
  {
    id: "woodruff-library",
    icon: "📖",
    location: { lat: 33.79088688383609, lng: -84.32324104312072, name: "Woodruff Library" },
  },
  {
    id: "emory-student-center",
    icon: "🏫",
    location: { lat: 33.7935321317431, lng: -84.32408878880749, name: "Emory Student Center" },
  },
];
