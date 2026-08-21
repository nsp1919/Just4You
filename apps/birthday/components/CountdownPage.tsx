"use client";
import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";

interface Props {
  recipientName: string;
  eventDate: string; // ISO string YYYY-MM-DD
  occasionType?: string;
  theme?: string;
  exactTime?: boolean;
  labelOverride?: string;
}

const OCCASION_CONFIG: Record<string, { emoji: string; label: string; unlockMsg: string }> = {
  birthday: {
    emoji: "🎂",
    label: "Birthday Surprise",
    unlockMsg: "The celebration has begun! 🎉",
  },
  "kids-birthday": {
    emoji: "🧸",
    label: "Kids Birthday Surprise",
    unlockMsg: "Time to celebrate! 🎈",
  },
  anniversary: {
    emoji: "💍",
    label: "Anniversary Surprise",
    unlockMsg: "Love unlocked! 💖",
  },
  proposal: {
    emoji: "💌",
    label: "A Special Surprise",
    unlockMsg: "The moment has arrived! 💍",
  },
};

const THEME_CONFIG: Record<string, { gradient: string; accent: string; isLight: boolean; font: string }> = {
  galaxy: {
    gradient: "linear-gradient(135deg, #02000a 0%, #0c0827 50%, #010006 100%)",
    accent: "#c084fc", // vibrant light purple
    isLight: false,
    font: "'Playfair Display', serif",
  },
  floral: {
    gradient: "linear-gradient(135deg, #fff5f8 0%, #ffe8ef 50%, #fff9fb 100%)",
    accent: "#c2185b", // deep rose pink
    isLight: true,
    font: "'Cormorant Garamond', Georgia, serif",
  },
  neon: {
    gradient: "linear-gradient(135deg, #030303 0%, #0a0a0a 50%, #000000 100%)",
    accent: "#39ff14", // electric neon green
    isLight: false,
    font: "'Playfair Display', serif",
  },
  minimal: {
    gradient: "linear-gradient(135deg, #f9f9f9 0%, #f1f1f1 50%, #fdfdfd 100%)",
    accent: "#1a1a2e", // elegant dark charcoal
    isLight: true,
    font: "'Lora', Georgia, serif",
  },
  retro: {
    gradient: "linear-gradient(135deg, #120a03 0%, #201107 50%, #0b0501 100%)",
    accent: "#c9aa7a", // warm vintage gold
    isLight: false,
    font: "'IM Fell English', Georgia, serif",
  },
  magical: {
    gradient: "linear-gradient(135deg, #0a0015 0%, #1c0035 50%, #05000c 100%)",
    accent: "#a78bfa", // magical pastel violet
    isLight: false,
    font: "'Playfair Display', serif",
  },
};

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; total: number }

function getTimeLeft(targetDate: string, exactTime = false): TimeLeft {
  const target = new Date(targetDate);
  if (!exactTime) target.setHours(0, 0, 0, 0);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountUnit({ value, label, isLight, accent }: { value: number; label: string; isLight: boolean; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105"
        style={{
          background: isLight 
            ? "rgba(255, 255, 255, 0.85)" 
            : "rgba(0, 0, 0, 0.5)",
          border: `2px solid ${accent}80`,
          backdropFilter: "blur(20px)",
          boxShadow: isLight
            ? `0 10px 30px ${accent}15, inset 0 1px 0 rgba(255,255,255,0.6)`
            : `0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 15px ${accent}25`,
        }}
      >
        <span
          className="text-3xl md:text-5xl font-bold tabular-nums"
          style={{
            fontFamily: "monospace",
            color: isLight ? accent : "white",
            textShadow: isLight 
              ? "none" 
              : `0 0 12px ${accent}cc, 0 0 2px rgba(255,255,255,0.8)`,
          }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className="text-[10px] md:text-xs uppercase tracking-widest font-bold"
        style={{ color: isLight ? accent : `${accent}ee` }}
      >
        {label}
      </span>
    </div>
  );
}

const COUNTDOWN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;1,400&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=IM+Fell+English:ital@0;1&display=swap');
  @keyframes countdownFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes countdownPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
  @keyframes countdownOrb { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.1)} 66%{transform:translate(-20px,15px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
  @keyframes unlockPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
`;

export default function CountdownPage({ recipientName, eventDate, occasionType = "birthday", theme, exactTime = false, labelOverride }: Props) {
  const config = OCCASION_CONFIG[occasionType] ?? OCCASION_CONFIG.birthday;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(eventDate, exactTime));
  const [unlocked, setUnlocked] = useState(false);

  // Resolve styling based on theme
  const themeKey = (theme || "galaxy").toLowerCase();
  const themeConfig = THEME_CONFIG[themeKey] || THEME_CONFIG.galaxy;

  const isLight = themeConfig.isLight;
  const accent = themeConfig.accent;
  const gradient = themeConfig.gradient;
  const font = themeConfig.font;

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ["#f59e0b", "#ec4899", "#a855f7", "#22c55e", "#fff"] });
    setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.6, x: 0.2 }, colors: ["#ff6b6b", "#ffd93d", "#6bcb77"] }), 500);
    setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.6, x: 0.8 }, colors: ["#4d96ff", "#ff6b6b", "#ffd93d"] }), 800);
  }, []);

  useEffect(() => {
    const tick = () => {
      const tl = getTimeLeft(eventDate, exactTime);
      setTimeLeft(tl);
      if (tl.total <= 0 && !unlocked) {
        setUnlocked(true);
        fireConfetti();
        // BUG-07: auto-reload after 3 s so the user doesn't have to manually
        // click refresh — the confetti plays, then the real celebration page appears.
        setTimeout(() => window.location.reload(), 3000);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventDate, exactTime, unlocked, fireConfetti]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: gradient }}
    >
      <style dangerouslySetInnerHTML={{ __html: COUNTDOWN_CSS }} />

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${300 + i * 150}px`,
              height: `${300 + i * 150}px`,
              top: `${[10, 50, 70][i]}%`,
              left: `${[70, 20, 60][i]}%`,
              background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
              animation: `countdownOrb ${8 + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Emoji */}
        <div className="text-8xl mb-6 inline-block" style={{ animation: "countdownFloat 4s ease-in-out infinite" }}>
          {config.emoji}
        </div>

        {/* Title */}
        <p className="text-sm uppercase tracking-[0.3em] mb-3" style={{ color: isLight ? `${accent}cc` : `${accent}ee`, fontFamily: font }}>
          {labelOverride ?? config.label} for
        </p>
        <h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{
            fontFamily: font,
            color: isLight ? "#1a1a2e" : "white",
            textShadow: isLight ? "none" : `0 0 40px ${accent}60`,
          }}
        >
          {recipientName}
        </h1>

        {unlocked ? (
          <div style={{ animation: "unlockPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: font, color: isLight ? "#1a1a2e" : "white" }}>
              {config.unlockMsg}
            </h2>
            <p className="mb-8" style={{ color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)" }}>
              Opening your surprise in a moment... ✨
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-10 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${accent}, #ec4899)`, boxShadow: `0 10px 30px ${accent}40` }}
            >
              Open Surprise 🎁
            </button>
          </div>
        ) : (
          <>
            <p
              className="mb-10 text-lg italic"
              style={{
                fontFamily: font,
                color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)",
              }}
            >
              Something magical is being prepared for you...
            </p>

            {/* Countdown units */}
            <div className="flex justify-center items-center gap-3 md:gap-5 mb-10">
              <CountUnit value={timeLeft.days} label="Days" isLight={isLight} accent={accent} />
              <div className="text-3xl md:text-5xl font-bold self-center mb-6" style={{ color: isLight ? `${accent}aa` : `${accent}cc`, textShadow: isLight ? "none" : `0 0 10px ${accent}aa` }}>:</div>
              <CountUnit value={timeLeft.hours} label="Hours" isLight={isLight} accent={accent} />
              <div className="text-3xl md:text-5xl font-bold self-center mb-6" style={{ color: isLight ? `${accent}aa` : `${accent}cc`, textShadow: isLight ? "none" : `0 0 10px ${accent}aa` }}>:</div>
              <CountUnit value={timeLeft.minutes} label="Minutes" isLight={isLight} accent={accent} />
              <div className="text-3xl md:text-5xl font-bold self-center mb-6" style={{ color: isLight ? `${accent}aa` : `${accent}cc`, textShadow: isLight ? "none" : `0 0 10px ${accent}aa` }}>:</div>
              <CountUnit value={timeLeft.seconds} label="Seconds" isLight={isLight} accent={accent} />
            </div>

            <p className="text-sm font-medium" style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>
              This link will unlock automatically on the day. Keep it safe! 🔒
            </p>
          </>
        )}

        {/* Just4You branding */}
        <div className="mt-16 text-xs font-semibold" style={{ color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)" }}>
          Made with ❤️ on{" "}
          <a href="https://just4you.in" className="hover:underline transition-all" style={{ color: accent }}>
            Just4You
          </a>
        </div>
      </div>
    </main>
  );
}
