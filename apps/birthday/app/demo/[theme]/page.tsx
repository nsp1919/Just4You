import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import type { Metadata } from "next";
import GalaxyTheme from "@/components/themes/GalaxyTheme";
import FloralTheme from "@/components/themes/FloralTheme";
import NeonTheme from "@/components/themes/NeonTheme";
import MinimalTheme from "@/components/themes/MinimalTheme";
import RetroTheme from "@/components/themes/RetroTheme";
import MagicalTheme from "@/components/themes/MagicalTheme";
import BrandFooter from "@/components/BrandFooter";

// Public, no-auth live demos — one per theme. These let visitors experience
// the real celebration themes (with the new 3D-on-scroll effects) before
// creating their own on the main platform.

interface Props {
  params: Promise<{ theme: string }>;
}

const THEME_COMPONENTS: Record<string, ComponentType<any>> = {
  galaxy: GalaxyTheme,
  floral: FloralTheme,
  neon: NeonTheme,
  minimal: MinimalTheme,
  retro: RetroTheme,
  magical: MagicalTheme,
};

const THEME_LABELS: Record<string, string> = {
  galaxy: "Galaxy",
  floral: "Floral",
  neon: "Neon",
  minimal: "Minimal",
  retro: "Retro",
  magical: "Magical",
};

const DEMO_PHOTOS = [
  "/wedding-demo/couple.jpg",
  "/wedding-demo/haldi.jpg",
  "/wedding-demo/mehndi.jpg",
  "/wedding-demo/sangeet.jpg",
];

const DEMO_MUSIC_BY_THEME: Record<string, string> = {
  galaxy: "t6",
  floral: "t2",
  neon: "t8",
  minimal: "t5",
  retro: "t7",
  magical: "t3",
};

// Sample content tailored to each theme so every demo feels intentional.
const DEMO_CONTENT: Record<
  string,
  { recipientName: string; occasionType: string; relation: string; message: string; photos: string[] }
> = {
  galaxy: {
    recipientName: "Aarav",
    occasionType: "birthday",
    relation: "friend",
    message:
      "Happy Birthday, my cosmic soul! 🌌 Across every galaxy and every lifetime, I'd always find my way back to you. Here's to another orbit around the sun — may it be your brightest yet. ✨",
    photos: DEMO_PHOTOS,
  },
  floral: {
    recipientName: "Priya & Rahul",
    occasionType: "anniversary",
    relation: "spouse",
    message:
      "Happy Anniversary, my love. 🌸 Every petal of this life has bloomed brighter because of you. Here's to the garden we've grown together — and to forever tending it, hand in hand.",
    photos: DEMO_PHOTOS,
  },
  neon: {
    recipientName: "Kabir",
    occasionType: "birthday",
    relation: "friend",
    message:
      "Happy Birthday, legend! ⚡ Another year, another level unlocked. Keep glowing brighter than the city lights — the world's not ready for what you're about to do. 🔥",
    photos: DEMO_PHOTOS,
  },
  minimal: {
    recipientName: "Ananya",
    occasionType: "birthday",
    relation: "partner",
    message:
      "Happy Birthday. In a world of noise, you are my quiet. Thank you for every simple, perfect moment. Today, and always — you.",
    photos: DEMO_PHOTOS,
  },
  retro: {
    recipientName: "Meera",
    occasionType: "birthday",
    relation: "friend",
    message:
      "Happy Birthday, old soul! 🎞️ Some memories never fade — they just get warmer with time, like this one. Here's to more grainy, golden, unforgettable days together.",
    photos: DEMO_PHOTOS,
  },
  magical: {
    recipientName: "Chintu",
    occasionType: "kids-birthday",
    relation: "son",
    message:
      "Happy Birthday to our little superstar! 🎈 May your day be filled with balloons, cake, giggles and all the magic in the world. We love you to the moon and back! 🧸",
    photos: DEMO_PHOTOS,
  },
};

export function generateStaticParams() {
  return Object.keys(THEME_COMPONENTS).map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme } = await params;
  const label = THEME_LABELS[theme];
  if (!label) return { title: "Demo — Just4You" };
  return {
    title: `${label} Theme — Live Demo | Just4You`,
    description: `Experience the ${label} celebration website theme live, with immersive 3D-on-scroll effects.`,
  };
}

export default async function DemoThemePage({ params }: Props) {
  const { theme } = await params;
  const Theme = THEME_COMPONENTS[theme];
  const content = DEMO_CONTENT[theme];
  if (!Theme || !content) return notFound();

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const demoCelebration = {
    id: `demo-${theme}`,
    recipientName: content.recipientName,
    birthdayDate: "2000-01-01",
    eventDate: "2000-01-01",
    message: content.message,
    theme,
    photos: content.photos,
    musicType: "preset",
    musicPresetId: DEMO_MUSIC_BY_THEME[theme],
    voiceMessageUrl: "/demo-media/voice-message.wav",
    videoMessageUrl: "/demo-media/video-message.mp4",
    occasionType: content.occasionType,
    relation: content.relation,
    expiresAt: oneYearFromNow.toISOString(),
    views: 1287,
    isDemo: true,
  };

  return (
    <>
      <Theme celebration={demoCelebration} />
      <BrandFooter />
    </>
  );
}
