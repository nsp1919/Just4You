// Seasonal micro-campaign framework. Free, no-auth "mini cards" whose data is
// encoded entirely in the share URL (no DB) so they're instantly shareable and
// serverless. Each card upsells into the full paid surprise-website flow.

export interface Campaign {
  id: string;
  label: string;
  emoji: string;
  greeting: string; // headline shown on the card
  eyebrow: string;
  bg: string; // page background gradient
  cardBg: string;
  accent: string;
  ink: string;
  particles: string[];
  placeholderMsg: string;
}

export const CAMPAIGNS: Record<string, Campaign> = {
  valentine: {
    id: "valentine",
    label: "Valentine's Day",
    emoji: "💗",
    greeting: "Happy Valentine's Day",
    eyebrow: "A little love for you",
    bg: "linear-gradient(160deg,#2a0a14 0%,#3d0f1f 50%,#1a0610 100%)",
    cardBg: "rgba(255,255,255,0.06)",
    accent: "#ff5f8f",
    ink: "#fff0f4",
    particles: ["💗", "💕", "🌹", "✨", "💘"],
    placeholderMsg: "You make every ordinary day feel like magic. Happy Valentine's Day ❤️",
  },
  diwali: {
    id: "diwali",
    label: "Diwali",
    emoji: "🪔",
    greeting: "Happy Diwali",
    eyebrow: "Wishing you light & joy",
    bg: "linear-gradient(160deg,#1a0f04 0%,#2e1a06 50%,#140b03 100%)",
    cardBg: "rgba(255,240,210,0.06)",
    accent: "#ffb23e",
    ink: "#fff4dc",
    particles: ["🪔", "✨", "🎆", "🌟", "🏵️"],
    placeholderMsg: "May your life shine as bright as a thousand diyas. Happy Diwali! 🪔",
  },
  friendship: {
    id: "friendship",
    label: "Friendship Day",
    emoji: "🤝",
    greeting: "Happy Friendship Day",
    eyebrow: "To my favourite person",
    bg: "linear-gradient(160deg,#04201f 0%,#063a34 50%,#03181a 100%)",
    cardBg: "rgba(220,255,250,0.06)",
    accent: "#4ecdc4",
    ink: "#eafffb",
    particles: ["🤝", "💛", "🌟", "✨", "🫶"],
    placeholderMsg: "Life's better with you in it. Thanks for being my person. Happy Friendship Day! 💛",
  },
  rakhi: {
    id: "rakhi",
    label: "Raksha Bandhan",
    emoji: "🧵",
    greeting: "Happy Raksha Bandhan",
    eyebrow: "For my sibling",
    bg: "linear-gradient(160deg,#26060f 0%,#3a0d1a 50%,#180410 100%)",
    cardBg: "rgba(255,235,220,0.06)",
    accent: "#ff8a5c",
    ink: "#fff2e8",
    particles: ["🧵", "🎀", "❤️", "✨", "🪢"],
    placeholderMsg: "No matter the distance, this bond stays unbreakable. Happy Rakhi! 🧵❤️",
  },
  birthday: {
    id: "birthday",
    label: "Birthday",
    emoji: "🎂",
    greeting: "Happy Birthday",
    eyebrow: "A little surprise for you",
    bg: "linear-gradient(160deg,#160a26 0%,#241040 50%,#0f0720 100%)",
    cardBg: "rgba(240,230,255,0.06)",
    accent: "#c084fc",
    ink: "#f5ecff",
    particles: ["🎂", "🎈", "✨", "🎉", "⭐"],
    placeholderMsg: "Another year of the wonderful you! Wishing you the brightest birthday yet. 🎉",
  },
};

export interface MiniCardData {
  c: string; // campaign id
  to: string;
  from: string;
  msg: string;
}

export function encodeMiniCard(data: MiniCardData): string {
  try {
    const json = JSON.stringify(data);
    const b64 = typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(json))) : Buffer.from(json).toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeMiniCard(param: string): MiniCardData | null {
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window !== "undefined" ? decodeURIComponent(escape(window.atob(b64))) : Buffer.from(b64, "base64").toString("utf8");
    const data = JSON.parse(json);
    if (data && typeof data.c === "string") return data as MiniCardData;
    return null;
  } catch {
    return null;
  }
}
