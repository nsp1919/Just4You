import { Timestamp } from "firebase/firestore";

// ─── User ──────────────────────────────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: "user" | "admin";
  isBlocked: boolean;
  createdAt: Timestamp;
}

// ─── Theme ─────────────────────────────────────────────────────────────────
export type Theme = "galaxy" | "floral" | "neon" | "minimal" | "retro" | "magical";

export const THEMES: { id: Theme; label: string; description: string; colors: string[] }[] = [
  {
    id: "galaxy",
    label: "Galaxy",
    description: "Deep space vibes with stars, nebula, and cosmic glow",
    colors: ["#0f0c29", "#302b63", "#f7d971"],
  },
  {
    id: "floral",
    label: "Floral",
    description: "Romantic pink petals, soft cream, elegant serif typography",
    colors: ["#fff0f5", "#ffb6c1", "#c8a96e"],
  },
  {
    id: "neon",
    label: "Neon",
    description: "Electric cyberpunk with glitch effects on dark canvas",
    colors: ["#0a0a0a", "#00fff5", "#ff00ff"],
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean white, generous spacing, pure typographic elegance",
    colors: ["#ffffff", "#1a1a1a", "#6366f1"],
  },
  {
    id: "retro",
    label: "Retro",
    description: "Warm vintage tones, film grain, typewriter text reveal",
    colors: ["#2c1810", "#d4a96a", "#f5e6d3"],
  },
  {
    id: "magical",
    label: "Magical",
    description: "Bright colors, floating balloons, toys, cute animations",
    colors: ["#fff7ed", "#fdf2f8", "#f43f5e"],
  },
];

// ─── Music ─────────────────────────────────────────────────────────────────
export type MusicType = "preset" | "upload" | "none";

export interface PresetTrack {
  id: string;
  label: string;
  artist: string;
  url: string; // hosted audio URL
  mood: string;
}

export const PRESET_TRACKS: PresetTrack[] = [
  { id: "t1", label: "Warm Birthday", artist: "Just4You", url: "/music/warm-birthday.mp3", mood: "happy" },
  { id: "t2", label: "Cinematic Love", artist: "Just4You", url: "/music/cinematic-love.mp3", mood: "romantic" },
  { id: "t3", label: "Upbeat Celebrate", artist: "Just4You", url: "/music/upbeat-celebrate.mp3", mood: "party" },
  { id: "t4", label: "Soft Piano", artist: "Just4You", url: "/music/soft-piano.mp3", mood: "emotional" },
  { id: "t5", label: "Dreamy Stars", artist: "Just4You", url: "/music/dreamy-stars.mp3", mood: "dreamy" },
  { id: "t6", label: "Jazz Vibes", artist: "Just4You", url: "/music/jazz-vibes.mp3", mood: "classy" },
  { id: "t7", label: "Guitar Serenade", artist: "Just4You", url: "/music/guitar-serenade.mp3", mood: "warm" },
  { id: "t8", label: "Orchestral Grand", artist: "Just4You", url: "/music/orchestral-grand.mp3", mood: "epic" },
];

// ─── Celebration ───────────────────────────────────────────────────────────
export type OccasionType = "birthday" | "kids-birthday" | "anniversary" | "proposal";

export type RelationType = 
  // Birthday & general relations
  | "friend" | "partner" | "parent" | "sibling" | "colleague" | "child" | "grandparent" | "husband" | "wife" | "girlfriend" | "boyfriend"
  // Kids Birthday relations
  | "son" | "daughter" | "nephew" | "niece" | "grandchild"
  // Anniversary relations
  | "spouse"
  // General fallback
  | "custom" | string;

export interface Celebration {
  id: string;
  slug: string;               // nanoid(8) — unique URL key
  userId: string;             // Firebase Auth UID
  recipientName: string;
  birthdayDate: string;       // Deprecated: ISO date string YYYY-MM-DD
  eventDate?: string;          // ISO date string YYYY-MM-DD (preferred)
  message: string;            // Personal message, max 500 chars
  theme: Theme;
  photos: string[];           // Cloudinary URLs, max 8
  musicType: MusicType;
  musicPresetId?: string;     // track id from PRESET_TRACKS
  musicUploadUrl?: string;    // Cloudinary URL for uploaded audio
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: Timestamp;
  expiresAt: Timestamp;       // createdAt + 365 days
  views: number;
  isActive: boolean;
  isBlocked: boolean;         // admin can block
  occasionType?: OccasionType; // Optional for backwards compatibility
  relation?: RelationType;     // Optional for backwards compatibility
  relationCustom?: string;     // Custom written relation if relation === 'custom'
  proposalResponse?: "yes" | "no" | null; // Response for proposal cards
  countdownEnabled?: boolean;  // If true, shows countdown until eventDate before revealing page
  voiceMessageUrl?: string;    // Cloudinary URL for creator voice message/recording
}

// ─── Admin / Revenue ───────────────────────────────────────────────────────
export interface RevenueEntry {
  date: string; // YYYY-MM-DD
  amount: number;
  count: number;
}

// ─── Firestore collection names ───────────────────────────────────────────
export const COLLECTIONS = {
  USERS: "users",
  CELEBRATIONS: "celebrations",
} as const;

// ─── Constants ─────────────────────────────────────────────────────────────
export const MAX_PHOTOS = 8;
export const PRICE_INR = 299;
export const PRICE_PAISE = 29900; // Razorpay uses paise
export const VALIDITY_DAYS = 365;
