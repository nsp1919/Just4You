export const COLLECTIONS = {
  USERS: "users",
  CELEBRATIONS: "celebrations",
  WALLET_WITHDRAWALS: "walletWithdrawals",
} as const;

export const MAX_PHOTOS = 8;
// Fallback base price used only if a feature-based total can't be computed.
// Must mirror BASE_PACKAGE.priceInr so a fallback never undercharges.
export const PRICE_INR = 149;
export const PRICE_PAISE = 14900;
export const VALIDITY_DAYS = 365;
export const MAX_MESSAGE_LENGTH = 500;

// ─── Feature-based pricing (à la carte cart) ─────────────────────────────────
// Every website starts from a base package; users add paid features to a cart
// and the total is computed from their selection. Pricing is ALWAYS recomputed
// server-side from the persisted feature list — the client total is display-only.

export type FeatureId =
  | "extra_photos"
  | "custom_music"
  | "voice_message"
  | "video_message"
  | "countdown"
  | "hosting_3yr"
  | "hosting_lifetime"
  | "advanced_analytics"
  | "scheduled_delivery"
  | "custom_link";

export interface FeatureAddon {
  id: FeatureId;
  label: string;
  description: string;
  priceInr: number;
  icon: string;
}

export const BASE_PACKAGE = {
  id: "base",
  label: "Base Website",
  priceInr: 149,
  includes: [
    "1 premium animated theme",
    "Up to 5 photos",
    "A preset music track",
    "Guest wishes & reactions wall",
    "Shareable link (WhatsApp / Instagram)",
    "Mobile-friendly on all devices",
    "Instant delivery after payment",
    "Secure hosting for 1 full year",
  ],
} as const;

export const FEATURE_ADDONS: FeatureAddon[] = [
  {
    id: "extra_photos",
    label: "Extra Photos",
    description: "Increase your gallery from 5 to 25 photos.",
    priceInr: 79,
    icon: "📸",
  },
  {
    id: "custom_music",
    label: "Upload Your Own Song",
    description: "Set the page to their favourite track instead of a preset.",
    priceInr: 49,
    icon: "🎵",
  },
  {
    id: "voice_message",
    label: "Personal Voice Message",
    description: "Record a heartfelt voice note that plays on their page.",
    priceInr: 79,
    icon: "🎤",
  },
  {
    id: "video_message",
    label: "Video Message",
    description: "Add a personal video that plays inside their surprise page.",
    priceInr: 129,
    icon: "🎥",
  },
  {
    id: "countdown",
    label: "Countdown Reveal",
    description: "Lock the page with an animated countdown until the big day.",
    priceInr: 49,
    icon: "⏳",
  },
  {
    id: "hosting_3yr",
    label: "3-Year Hosting",
    description: "Keep the website live for 3 full years instead of 1.",
    priceInr: 149,
    icon: "🗓️",
  },
  {
    id: "hosting_lifetime",
    label: "Lifetime Hosting",
    description: "Keep this keepsake online forever — never expires.",
    priceInr: 299,
    icon: "♾️",
  },
  {
    id: "advanced_analytics",
    label: "Advanced Analytics",
    description: "See who opened it, when, from where and on what device.",
    priceInr: 49,
    icon: "📊",
  },
  {
    id: "scheduled_delivery",
    label: "Scheduled Delivery",
    description: "We email the surprise to your recipient at the exact date & time you choose.",
    priceInr: 49,
    icon: "⏰",
  },
  {
    id: "custom_link",
    label: "Custom Link",
    description: "A memorable link like just4you.buzz/p/priya-birthday instead of a random code.",
    priceInr: 79,
    icon: "🔗",
  },
];

// Hosting tiers are mutually exclusive in the cart (pick at most one).
export const HOSTING_FEATURE_IDS: FeatureId[] = ["hosting_3yr", "hosting_lifetime"];

/** Hosting length in years for a feature set. Number of years, or "lifetime". */
export function hostingYearsFor(features: string[] = []): number | "lifetime" {
  if (features.includes("hosting_lifetime")) return "lifetime";
  if (features.includes("hosting_3yr")) return 3;
  return 1;
}

// Convenience presets that pre-select a set of add-ons. Prices are still the
// plain sum of base + selected add-ons (no hidden math) so the cart is honest.
export interface Bundle {
  id: string;
  label: string;
  tagline: string;
  addons: FeatureId[];
  badge?: string;
}

export const BUNDLES: Bundle[] = [
  {
    id: "lite",
    label: "Lite",
    tagline: "The essentials to delight someone.",
    addons: [],
  },
  {
    id: "classic",
    label: "Classic",
    tagline: "Our most-loved mix of memories & music.",
    addons: ["extra_photos", "custom_music", "countdown"],
    badge: "Most Popular",
  },
  {
    id: "grand",
    label: "Grand",
    tagline: "Everything, for an unforgettable surprise.",
    addons: ["extra_photos", "custom_music", "voice_message", "countdown"],
    badge: "Best Value",
  },
];

export const BASE_PHOTO_LIMIT = 5;
export const EXTRA_PHOTO_LIMIT = 25;

/** Photo upload allowance based on the purchased features. */
export function photoLimitFor(features: string[] = []): number {
  return features.includes("extra_photos") ? EXTRA_PHOTO_LIMIT : BASE_PHOTO_LIMIT;
}

/** Total price in rupees for a set of selected add-on feature ids. */
export function computePriceInr(features: string[] = []): number {
  const addons = FEATURE_ADDONS.filter((a) => features.includes(a.id)).reduce(
    (sum, a) => sum + a.priceInr,
    0
  );
  return BASE_PACKAGE.priceInr + addons;
}

/** Server-authoritative total in paise for a set of selected feature ids. */
export function computePricePaise(features: string[] = []): number {
  return computePriceInr(features) * 100;
}

export const WEDDING_BASE_PRICE_INR = 149;
export const WEDDING_ADDITIONAL_CEREMONY_PRICE_INR = 49;
export const WEDDING_RSVP_PRICE_INR = 49;
export const WEDDING_CUSTOM_REVEAL_MUSIC_PRICE_INR = 29;
export const MAX_WEDDING_CEREMONIES = 6;

export interface WeddingPriceInput {
  ceremonyCount: number;
  rsvpEnabled: boolean;
  customMusicCount: number;
}

export function computeWeddingPriceInr(input: WeddingPriceInput): number {
  const ceremonyCount = Math.max(1, Math.min(MAX_WEDDING_CEREMONIES, Math.floor(input.ceremonyCount)));
  const customMusicCount = Math.max(0, Math.min(ceremonyCount, Math.floor(input.customMusicCount)));
  return WEDDING_BASE_PRICE_INR
    + Math.max(0, ceremonyCount - 1) * WEDDING_ADDITIONAL_CEREMONY_PRICE_INR
    + (input.rsvpEnabled ? WEDDING_RSVP_PRICE_INR : 0)
    + customMusicCount * WEDDING_CUSTOM_REVEAL_MUSIC_PRICE_INR;
}

export function weddingPriceBreakdown(input: WeddingPriceInput): { label: string; amountInr: number }[] {
  const ceremonyCount = Math.max(1, Math.min(MAX_WEDDING_CEREMONIES, Math.floor(input.ceremonyCount)));
  const customMusicCount = Math.max(0, Math.min(ceremonyCount, Math.floor(input.customMusicCount)));
  return [
    { label: "Wedding invitation · 1 ceremony", amountInr: WEDDING_BASE_PRICE_INR },
    ...(ceremonyCount > 1 ? [{ label: `${ceremonyCount - 1} additional ${ceremonyCount === 2 ? "ceremony" : "ceremonies"}`, amountInr: (ceremonyCount - 1) * WEDDING_ADDITIONAL_CEREMONY_PRICE_INR }] : []),
    ...(input.rsvpEnabled ? [{ label: "WhatsApp RSVP", amountInr: WEDDING_RSVP_PRICE_INR }] : []),
    ...(customMusicCount > 0 ? [{ label: `${customMusicCount} custom reveal ${customMusicCount === 1 ? "track" : "tracks"}`, amountInr: customMusicCount * WEDDING_CUSTOM_REVEAL_MUSIC_PRICE_INR }] : []),
  ];
}

/** Format a rupee amount for display. */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── Referral program ────────────────────────────────────────────────────────
// A referred user receives ₹50 in their wallet when they join. The referrer
// receives ₹100 in their wallet after that user's first successful purchase.
export const REFERRAL_JOIN_WALLET_BONUS_INR = 50;
export const REFERRAL_REWARD_INR = 100;
export const REFERRAL_MILESTONE_COUNT = 3; // every N referrals → a free add-on credit

export type Theme = "galaxy" | "floral" | "neon" | "minimal" | "retro" | "magical" | "wedding";

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
  {
    id: "wedding" as Theme,
    label: "🪔 Wedding Invitation",
    description: "Ceremonial doors, festival reveals, RSVP and event timeline",
    gradient: "from-[#d9a01d] via-[#8a1736] to-[#315a46]",
    accent: "#d9a01d",
    preview: ["#d9a01d", "#8a1736", "#315a46"],
  },
] as const;

export type OccasionType = "birthday" | "kids-birthday" | "anniversary" | "proposal" | "wedding";

export type WeddingCeremonyInteraction = "scratch" | "trace" | "rhythm" | "reveal";

export interface WeddingCeremonyDraft {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  dressCode: string;
  note: string;
  image: string;
  revealMusicUrl: string;
  interaction: WeddingCeremonyInteraction;
  selected: boolean;
}

export interface WeddingDataDraft {
  partnerOne: string;
  partnerTwo: string;
  families: string;
  location: string;
  hashtag: string;
  directionsUrl: string;
  whatsappNumber: string;
  rsvpEnabled: boolean;
  ceremonies: WeddingCeremonyDraft[];
}

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
  {
    id: "wedding",
    label: "Wedding Invitation",
    emoji: "🪔",
    description: "Interactive multi-event wedding invitation with RSVP and festival reveals",
    dateLabel: "Wedding Date",
    namePlaceholder: "e.g. Aarohi & Vihaan",
    messagePlaceholder: "Invite your guests with a warm note from both families...",
    defaultTheme: "wedding",
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
  wedding: [
    { id: "couple", label: "The Couple 💍" },
    { id: "family", label: "Family of the Couple 🪔" },
    { id: "planner", label: "Wedding Planner ✨" },
    { id: "custom", label: "Other / Custom ✏️" },
  ],
};

export const DEFAULT_WEDDING_CEREMONIES: WeddingCeremonyDraft[] = [
  {
    id: "haldi",
    name: "Haldi",
    subtitle: "Sunshine, laughter and turmeric",
    date: "",
    time: "16:00",
    venue: "",
    dressCode: "Shades of yellow",
    note: "An afternoon painted in sunshine and the warmest blessings.",
    image: "",
    revealMusicUrl: "",
    interaction: "scratch",
    selected: true,
  },
  {
    id: "mehndi",
    name: "Mehndi",
    subtitle: "Where henna meets hearts",
    date: "",
    time: "17:30",
    venue: "",
    dressCode: "Pastels and florals",
    note: "The deeper the mehndi, the deeper the love.",
    image: "",
    revealMusicUrl: "",
    interaction: "trace",
    selected: true,
  },
  {
    id: "sangeet",
    name: "Sangeet",
    subtitle: "An evening of song",
    date: "",
    time: "19:00",
    venue: "",
    dressCode: "Jewel tones",
    note: "Music, mischief and the whole family on its feet.",
    image: "",
    revealMusicUrl: "",
    interaction: "rhythm",
    selected: true,
  },
  {
    id: "bonalu",
    name: "Bonalu",
    subtitle: "A celebration of gratitude and blessings",
    date: "",
    time: "11:00",
    venue: "",
    dressCode: "Traditional festive attire",
    note: "Join our family as we offer Bonam and seek the blessings of Ammavaru before the wedding.",
    image: "",
    revealMusicUrl: "",
    interaction: "reveal",
    selected: false,
  },
  {
    id: "wedding",
    name: "The Wedding",
    subtitle: "The muhurtham",
    date: "",
    time: "18:00",
    venue: "",
    dressCode: "Traditional",
    note: "The sacred vows, witnessed by everyone we love.",
    image: "",
    revealMusicUrl: "",
    interaction: "reveal",
    selected: true,
  },
  {
    id: "reception",
    name: "Reception",
    subtitle: "Dinner and dancing",
    date: "",
    time: "19:30",
    venue: "",
    dressCode: "Evening formal",
    note: "Raise a toast and celebrate the beginning of forever.",
    image: "",
    revealMusicUrl: "",
    interaction: "reveal",
    selected: false,
  },
];

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

