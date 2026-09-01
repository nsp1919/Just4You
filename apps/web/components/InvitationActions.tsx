"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Ellipsis, Music2, Share2, Volume2, VolumeX } from "lucide-react";
import StoryCardModal from "./StoryCardModal";

interface Celebration {
  id?: string;
  recipientName: string;
  occasionType?: string;
  photos?: string[];
  message?: string;
  theme?: string;
  musicType?: string;
  musicPresetId?: string;
  musicUploadUrl?: string;
}

interface Props {
  celebration: Celebration;
  shareMessage: string;
  accentColor: string;
  isDark?: boolean;
  square?: boolean;
}

export default function InvitationActions({ celebration, shareMessage, accentColor, isDark = true, square = false }: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicUrl = celebration.musicType === "upload"
    ? celebration.musicUploadUrl
    : celebration.musicType === "preset" && celebration.musicPresetId
      ? `/music/${celebration.musicPresetId}.mp3`
      : null;

  useEffect(() => {
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setOpen(false);
      if (event instanceof PointerEvent && !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };
  const itemClass = `flex min-h-11 items-center gap-2 px-4 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.02] ${square ? "rounded-none" : "rounded-full"}`;
  const neutralStyle = {
    background: isDark ? "rgba(12,8,18,0.88)" : "rgba(255,255,255,0.92)",
    border: `1px solid ${accentColor}55`,
    color: accentColor,
    backdropFilter: "blur(16px)",
  };

  return (
    <>
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop data-background-music onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
      {musicUrl && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={playing ? "Pause background music" : "Play background music"}
          className={`fixed bottom-5 left-5 z-50 flex h-12 min-w-12 items-center justify-center gap-2 px-3 text-sm font-semibold shadow-2xl transition-transform hover:scale-105 ${square ? "rounded-none" : "rounded-full"}`}
          style={neutralStyle}
        >
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{playing ? "Pause music" : "Play music"}</span>
        </button>
      )}
      <div ref={menuRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {open && (
          <div id="invitation-actions" className="flex flex-col items-end gap-2" role="menu" aria-label="Invitation actions">
            <button type="button" role="menuitem" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${window.location.href}`)}`, "_blank", "noopener,noreferrer")} className={`${itemClass} text-white`} style={{ background: "#128c4a" }}><Share2 size={16} />WhatsApp</button>
            <button type="button" role="menuitem" onClick={() => void copyLink()} className={itemClass} style={neutralStyle}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy link"}</button>
            {celebration.id && <button type="button" role="menuitem" onClick={() => { setStoryOpen(true); setOpen(false); }} className={itemClass} style={neutralStyle}><Music2 size={16} />Story card</button>}
          </div>
        )}
        <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close invitation actions" : "Open invitation actions"} aria-expanded={open} aria-controls="invitation-actions" className={`grid h-12 w-12 place-items-center text-white shadow-2xl transition-transform hover:scale-105 ${square ? "rounded-none" : "rounded-full"}`} style={{ background: accentColor }}>{open ? <Ellipsis size={22} /> : <Share2 size={20} />}</button>
      </div>
      {celebration.id && <StoryCardModal celebration={celebration} slug={celebration.id} open={storyOpen} onOpenChange={setStoryOpen} hideTrigger />}
    </>
  );
}