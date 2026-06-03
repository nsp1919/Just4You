"use client";
import { useState, useRef, useCallback } from "react";
import { X, Download, Copy, Check, Share2 } from "lucide-react";

interface Props {
  celebration: {
    recipientName: string;
    occasionType?: string;
    photos?: string[];
    message?: string;
    theme?: string;
  };
  slug: string;
}

const OCCASION_META: Record<string, { emoji: string; tagline: string; gradient: string; accent: string; textColor: string }> = {
  birthday: {
    emoji: "🎂",
    tagline: "Wishing you the most magical birthday ever!",
    gradient: "linear-gradient(160deg,#2d0b55 0%,#1a0533 50%,#0a0612 100%)",
    accent: "#a855f7",
    textColor: "#fff",
  },
  "kids-birthday": {
    emoji: "🧸",
    tagline: "You make every day brighter and more magical!",
    gradient: "linear-gradient(160deg,#fff7ed 0%,#fdf2f8 50%,#ecfdf5 100%)",
    accent: "#f43f5e",
    textColor: "#1a1a2e",
  },
  anniversary: {
    emoji: "💍",
    tagline: "Every year with you is a gift I'll cherish forever.",
    gradient: "linear-gradient(160deg,#1a0010 0%,#3b0025 50%,#1a000d 100%)",
    accent: "#ec4899",
    textColor: "#fff",
  },
  proposal: {
    emoji: "💌",
    tagline: "The beginning of our forever starts right here.",
    gradient: "linear-gradient(160deg,#0a0020 0%,#1a0050 50%,#0a0012 100%)",
    accent: "#8b5cf6",
    textColor: "#fff",
  },
};

const STORY_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&display=swap');
  @keyframes storyModalIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes storyShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .story-modal-inner { animation: storyModalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
`;

export default function StoryCardModal({ celebration, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const occasionType = celebration.occasionType ?? "birthday";
  const meta = OCCASION_META[occasionType] ?? OCCASION_META.birthday;
  const firstName = celebration.recipientName.split(" ")[0];
  const wishUrl = typeof window !== "undefined" ? `${window.location.origin}/wish/${slug}` : "";

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `just4you-${firstName}-story.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloading(false);
    }
  }, [firstName]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(wishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [wishUrl]);

  const photoBg = celebration.photos?.[0];
  const isLight = occasionType === "kids-birthday";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STORY_CSS }} />

      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        id="story-card-btn"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
          boxShadow: "0 4px 24px rgba(131,58,180,0.5)",
        }}
      >
      <Share2 size={15} />
        <span>Share Story</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="story-modal-inner w-full max-w-sm flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="font-bold text-lg">📲 Share to Instagram Story</h2>
                <p className="text-white/50 text-xs mt-0.5">Download the card, then add it to your story</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={18} className="text-white/70" />
              </button>
            </div>

            {/* Story Card Preview (9:16 ratio compressed to fit) */}
            <div
              ref={cardRef}
              className="relative w-full overflow-hidden flex flex-col items-center justify-between text-center"
              style={{
                aspectRatio: "9/16",
                background: meta.gradient,
                borderRadius: "16px",
                padding: "32px 24px",
                fontFamily: "Playfair Display, serif",
              }}
            >
              {/* Photo background blur layer */}
              {photoBg && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${photoBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(12px) brightness(0.35)",
                    transform: "scale(1.1)",
                  }}
                />
              )}

              {/* Top content */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="text-5xl">{meta.emoji}</div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.accent }}>
                  A Special Surprise
                </p>
                <h1
                  className="text-3xl font-bold leading-tight"
                  style={{ color: meta.textColor, textShadow: isLight ? "none" : "0 2px 20px rgba(0,0,0,0.5)" }}
                >
                  For {firstName}
                </h1>
              </div>

              {/* Middle: photo */}
              {photoBg && (
                <div
                  className="relative z-10 w-40 h-40 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: `3px solid ${meta.accent}80` }}
                >
                  <img src={photoBg} alt={firstName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              )}

              {/* Tagline */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <p
                  className="text-sm leading-relaxed italic max-w-[220px]"
                  style={{ color: isLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)" }}
                >
                  "{meta.tagline}"
                </p>

                {/* URL pill */}
                <div
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: `${meta.accent}30`, border: `1px solid ${meta.accent}60`, color: meta.accent }}
                >
                  just4you.in/wish/{slug}
                </div>

                {/* Just4You branding */}
                <div style={{ color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)", fontSize: "10px" }}>
                  ✨ Made with <strong style={{ color: meta.accent }}>Just4You</strong>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
              >
                <Download size={16} />
                {downloading ? "Generating..." : "Download Card"}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <p className="text-center text-white/30 text-xs">
              Download → Open Instagram → Add to Your Story 📱
            </p>
          </div>
        </div>
      )}
    </>
  );
}
