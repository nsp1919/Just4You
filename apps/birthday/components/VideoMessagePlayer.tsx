"use client";
import { useEffect, useId } from "react";
import { Video } from "lucide-react";
import { setForegroundMediaPlaying } from "../lib/mediaPlayback";

interface Props {
  url: string;
  accentColor?: string;
  isDark?: boolean;
  label?: string;
}

export default function VideoMessagePlayer({
  url,
  accentColor = "#a855f7",
  isDark = true,
  label = "A video message, just for you",
}: Props) {
  const mediaId = useId();

  useEffect(() => () => setForegroundMediaPlaying(mediaId, false), [mediaId]);

  return (
    <div className="max-w-md mx-auto mt-8">
      <div
        className="flex items-center justify-center gap-2 mb-3 text-sm font-semibold tracking-wide"
        style={{ color: accentColor }}
      >
        <Video size={15} /> {label}
      </div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: `2px solid ${accentColor}55`,
          boxShadow: `0 16px 44px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"}, 0 0 0 6px ${accentColor}12`,
          background: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.6)",
        }}
      >
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          onPlay={() => setForegroundMediaPlaying(mediaId, true)}
          onPause={() => setForegroundMediaPlaying(mediaId, false)}
          onEnded={() => setForegroundMediaPlaying(mediaId, false)}
          className="w-full h-auto block"
          style={{ maxHeight: 420, background: "#000" }}
        />
      </div>
    </div>
  );
}