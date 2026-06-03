export const COLLECTIONS = {
  USERS: "users",
  CELEBRATIONS: "celebrations",
} as const;

export const MAX_PHOTOS = 8;
export const PRICE_INR = 299;
export const PRICE_PAISE = 29900;
export const VALIDITY_DAYS = 365;
export const MAX_MESSAGE_LENGTH = 500;

export type Theme = "galaxy" | "floral" | "neon" | "minimal" | "retro" | "magical";

export const THEMES = [
  {
    id: "galaxy" as Theme,
    label: "🌌 Galaxy",
    description: "Deep space vibes — stars, nebula & cosmic gold glow",
    gradient: "from-[#0f0c29] via-[#302b63] to-[#24243e]",
    accent: "#f7d971",
    preview: ["#0f0c29", "#302b63", "#f7d971"],
  },
  {
    id: "floral" as Theme,
    label: "🌸 Floral",
    description: "Romantic pink petals, soft cream, elegant serif typography",
    gradient: "from-[#fff0f5] via-[#ffe4ec] to-[#fff9fb]",
    accent: "#e75480",
    preview: ["#fff0f5", "#ffb6c1", "#c8a96e"],
  },
  {
    id: "neon" as Theme,
    label: "⚡ Neon",
    description: "Electric cyberpunk — glitch effects on pure dark canvas",
    gradient: "from-[#0a0a0a] via-[#111] to-[#0a0a0a]",
    accent: "#00fff5",
    preview: ["#0a0a0a", "#00fff5", "#ff00ff"],
  },
  {
    id: "minimal" as Theme,
    label: "🤍 Minimal",
    description: "Clean white, generous spacing, typographic elegance",
    gradient: "from-white via-[#f8f8ff] to-white",
    accent: "#6366f1",
    preview: ["#ffffff", "#1a1a1a", "#6366f1"],
  },
  {
    id: "retro" as Theme,
    label: "🎞️ Retro",
    description: "Warm vintage film tones, typewriter text, sepia charm",
    gradient: "from-[#2c1810] via-[#3d2314] to-[#2c1810]",
    accent: "#d4a96a",
    preview: ["#2c1810", "#d4a96a", "#f5e6d3"],
  },
  {
    id: "magical" as Theme,
    label: "🎈 Magical",
    description: "Playful cartoonish vibes — floating balloons, rainbow gradient & toys",
    gradient: "from-[#fff7ed] via-[#fdf2f8] to-[#ecfdf5]",
    accent: "#f43f5e",
    preview: ["#fff7ed", "#fdf2f8", "#f43f5e"],
  },
] as const;

export type OccasionType = "birthday" | "kids-birthday" | "anniversary" | "proposal";

export interface OccasionInfo {
  id: OccasionType;
  label: string;
  emoji: string;
  description: string;
  dateLabel: string;
  namePlaceholder: string;
  messagePlaceholder: string;
  defaultTheme: Theme;
}

export const OCCASIONS: OccasionInfo[] = [
  {
    id: "birthday",
    label: "Birthday",
    emoji: "🎂",
    description: "Classic birthday wishes for friends, family, and loved ones",
    dateLabel: "Their Birthday Date",
    namePlaceholder: "e.g. Priya, Mom, My Love ❤️",
    messagePlaceholder: "Write something heartfelt... This will appear on their birthday website 💌",
    defaultTheme: "galaxy",
  },
  {
    id: "kids-birthday",
    label: "Kids Birthday",
    emoji: "🧸",
    description: "Playful, bright, balloon-filled website for kids",
    dateLabel: "Their Birthday Date",
    namePlaceholder: "e.g. Aarav, Chintu, Princess 👑",
    messagePlaceholder: "Write a playful birthday wish for the little one! 🧸🎈",
    defaultTheme: "magical",
  },
  {
    id: "anniversary",
    label: "Marriage Anniversary",
    emoji: "💍",
    description: "Elegant and romantic site to celebrate years together",
    dateLabel: "Anniversary Date",
    namePlaceholder: "e.g. Priya & Rahul, Mom & Dad ❤️",
    messagePlaceholder: "Write about your beautiful journey, love, and highlights together... 💖",
    defaultTheme: "floral",
  },
  {
    id: "proposal",
    label: "Proposal",
    emoji: "💌",
    description: "Ask the big question with a gorgeous interactive surprise page",
    dateLabel: "Proposal Date / Special Day",
    namePlaceholder: "e.g. My Soulmate, Sweetheart 💕",
    messagePlaceholder: "Express your deepest feelings, your promises for forever, and pop the question! 🌹",
    defaultTheme: "galaxy",
  },
];

export const RELATION_BY_OCCASION: Record<OccasionType, { id: string; label: string }[]> = {
  birthday: [
    { id: "friend", label: "Friend 🤝" },
    { id: "partner", label: "Partner 💕" },
    { id: "husband", label: "Husband 🤵" },
    { id: "wife", label: "Wife 👰" },
    { id: "girlfriend", label: "Girlfriend 👩‍❤️‍👨" },
    { id: "boyfriend", label: "Boyfriend 👨‍❤️‍👨" },
    { id: "parent", label: "Parent 💖" },
    { id: "sibling", label: "Sibling 🧑‍🤝‍🧑" },
    { id: "child", label: "Child 👶" },
    { id: "colleague", label: "Colleague 💼" },
    { id: "grandparent", label: "Grandparent 👴👵" },
    { id: "custom", label: "Other / Custom ✏️" },
  ],
  "kids-birthday": [
    { id: "son", label: "Son 👦" },
    { id: "daughter", label: "Daughter 👧" },
    { id: "nephew", label: "Nephew 🧒" },
    { id: "niece", label: "Niece 👧" },
    { id: "grandchild", label: "Grandchild 👶" },
    { id: "custom", label: "Other / Custom ✏️" },
  ],
  anniversary: [
    { id: "spouse", label: "Spouse / Partner 💕" },
    { id: "husband", label: "Husband 🤵" },
    { id: "wife", label: "Wife 👰" },
    { id: "parent", label: "Parents 👴👵" },
    { id: "custom", label: "Other / Custom ✏️" },
  ],
  proposal: [
    { id: "girlfriend", label: "Girlfriend 👩‍❤️‍👨" },
    { id: "boyfriend", label: "Boyfriend 👨‍❤️‍👨" },
    { id: "partner", label: "Partner 💕" },
    { id: "custom", label: "Other / Custom ✏️" },
  ],
};

export const PRESET_TRACKS = [
  { id: "t1", label: "Warm Birthday", artist: "Just4You Originals", mood: "Happy 🎉", url: "/music/t1.mp3" },
  { id: "t2", label: "Cinematic Love", artist: "Just4You Originals", mood: "Romantic 💕", url: "/music/t2.mp3" },
  { id: "t3", label: "Upbeat Celebrate", artist: "Just4You Originals", mood: "Party 🎊", url: "/music/t3.mp3" },
  { id: "t4", label: "Soft Piano", artist: "Just4You Originals", mood: "Emotional 🥺", url: "/music/t4.mp3" },
  { id: "t5", label: "Dreamy Stars", artist: "Just4You Originals", mood: "Dreamy ✨", url: "/music/t5.mp3" },
  { id: "t6", label: "Jazz Vibes", artist: "Just4You Originals", mood: "Classy 🎷", url: "/music/t6.mp3" },
  { id: "t7", label: "Guitar Serenade", artist: "Just4You Originals", mood: "Warm 🎸", url: "/music/t7.mp3" },
  { id: "t8", label: "Orchestral Grand", artist: "Just4You Originals", mood: "Epic 🎻", url: "/music/t8.mp3" },
] as const;

