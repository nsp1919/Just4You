"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { setForegroundMediaPlaying } from "../lib/mediaPlayback";

interface Props {
  url: string;
  accentColor?: string;
  isDark?: boolean;
  label?: string;
}

const VOICE_CSS = `
  @keyframes voiceWave { 0%,100%{height:6px} 50%{height:28px} }
  @keyframes voicePulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
  @keyframes voiceMicIn { from{transform:scale(0.6) rotate(-15deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
  .voice-bar { animation: voiceWave linear infinite; border-radius: 4px; }
  .voice-mic-icon { animation: voiceMicIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
`;

const BAR_DELAYS = [0, 120, 240, 80, 200, 40, 160, 300, 100, 220, 60, 180];
const BAR_DURATIONS = [0.6, 0.8, 0.7, 0.9, 0.65, 0.75, 0.85, 0.7, 0.8, 0.6, 0.9, 0.7];

export default function VoiceMessagePlayer({ url, accentColor = "#a855f7", isDark = true, label = "Voice Message from your loved one" }: Props) {
  const mediaId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => () => setForegroundMediaPlaying(mediaId, false), [mediaId]);

  // Auto-play when scrolled into view (once)
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          setTimeout(() => {
            audioRef.current
              ?.play()
              .then(() => {
                // Autoplay succeeded — update UI to "playing" state.
                setPlaying(true);
                setHasPlayed(true);
              })
              .catch(() => {
                // BUG-16: browser blocked autoplay (NotAllowedError).
                // Reset state so the UI shows "Tap to listen" instead of
                // falsely displaying "Playing now..." with no audio.
                setPlaying(false);
                setHasPlayed(false);
              });
          }, 800);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [hasPlayed]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const textColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
  const mutedColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const bgCard = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.75)";
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  return (
    <div ref={containerRef} className="my-8 flex justify-center px-4">
      <style dangerouslySetInnerHTML={{ __html: VOICE_CSS }} />
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => {
          setPlaying(true);
          setForegroundMediaPlaying(mediaId, true);
        }}
        onPause={() => {
          setPlaying(false);
          setForegroundMediaPlaying(mediaId, false);
        }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) setProgress(a.currentTime / (a.duration || 1));
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a) setDuration(a.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setForegroundMediaPlaying(mediaId, false);
        }}
      />

      <div
        className="w-full max-w-md rounded-3xl p-5 flex flex-col gap-4"
        style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          backdropFilter: "blur(20px)",
          boxShadow: playing ? `0 0 40px ${accentColor}30` : "none",
          transition: "box-shadow 0.4s ease",
        }}
      >
        {/* Top row: icon + label */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}40`,
              animation: playing ? "voicePulse 1.5s ease-in-out infinite" : "none",
            }}
          >
            <Mic size={20} style={{ color: accentColor }} className="voice-mic-icon" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug" style={{ color: textColor }}>🎤 {label}</p>
            <p className="text-xs mt-0.5" style={{ color: mutedColor }}>
              {playing ? "Playing now..." : "Tap to listen"}
            </p>
          </div>
        </div>

        {/* Waveform visualizer */}
        <div className="flex items-center justify-center gap-1 h-9 cursor-pointer" onClick={toggle}>
          {BAR_DURATIONS.map((dur, i) => (
            <div
              key={i}
              className="voice-bar w-1.5 flex-shrink-0"
              style={{
                background: playing ? accentColor : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"),
                height: playing ? undefined : "6px",
                animationDuration: playing ? `${dur}s` : "none",
                animationDelay: playing ? `${BAR_DELAYS[i]}ms` : "0ms",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Progress bar + controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #ec4899)`, boxShadow: `0 4px 16px ${accentColor}50` }}
          >
            {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <div
              className="h-1.5 rounded-full overflow-hidden cursor-pointer"
              style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                const a = audioRef.current;
                if (a && a.duration) {
                  a.currentTime = ratio * a.duration;
                  setProgress(ratio);
                }
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${accentColor}, #ec4899)` }}
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: mutedColor }}>
              <span>{formatTime(duration * progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
