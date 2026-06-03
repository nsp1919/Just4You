"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  views: number;
  accentColor?: string;
  isDark?: boolean;
}

export default function ViewCounter({ views, accentColor = "#a855f7", isDark = true }: Props) {
  const [displayCount, setDisplayCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          // Animate count up from 0 to `views`
          const start = performance.now();
          const duration = Math.min(2000, views * 30);
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayCount(Math.floor(eased * views));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [views]);

  const textColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";

  const getMessage = () => {
    if (views <= 1) return "Be the first to share this! 🌟";
    if (views < 10) return `${displayCount} people have experienced this ✨`;
    if (views < 50) return `${displayCount} hearts touched by this surprise 💖`;
    if (views < 100) return `${displayCount} people loved this! 🎉`;
    return `🔥 ${displayCount} people are amazed by this!`;
  };

  return (
    <div ref={containerRef} className="flex items-center justify-center gap-2 mt-4">
      <span className="text-base" style={{ color: textColor }}>
        👁️{" "}
        <span
          className="font-bold tabular-nums"
          style={{ color: accentColor, fontVariantNumeric: "tabular-nums" }}
        >
          {displayCount.toLocaleString()}
        </span>{" "}
        {views <= 1 ? "view" : views < 10 ? "people have seen this" : views < 50 ? "hearts touched" : views < 100 ? "people loved this!" : "people amazed!"}
      </span>
      {views >= 50 && <span className="text-sm">🔥</span>}
    </div>
  );
}
