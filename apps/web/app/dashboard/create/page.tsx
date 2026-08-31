"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { COLLECTIONS, THEMES, PRESET_TRACKS, MAX_PHOTOS, MAX_MESSAGE_LENGTH, OCCASIONS, RELATION_BY_OCCASION, photoLimitFor, computePriceInr, computePricePaise, computeWeddingPriceInr, weddingPriceBreakdown, MAX_WEDDING_CEREMONIES, formatInr, FEATURE_ADDONS, BASE_PACKAGE } from "@/lib/constants";
import type { Theme, OccasionType, FeatureId, WeddingDataDraft, PricingSettings } from "@/lib/constants";
import { loadCartFeatures } from "@/lib/cart";
import { usePricingSettings } from "@/lib/use-pricing-settings";
import { Upload, Music, CreditCard, ArrowLeft, ArrowRight, X, Check, Mic, Square, Play, Pause, EyeOff, Save, Video } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import GalaxyTheme from "@/components/themes/GalaxyTheme";
import FloralTheme from "@/components/themes/FloralTheme";
import NeonTheme from "@/components/themes/NeonTheme";
import MinimalTheme from "@/components/themes/MinimalTheme";
import RetroTheme from "@/components/themes/RetroTheme";
import MagicalTheme from "@/components/themes/MagicalTheme";
import { trackEvent } from "@/lib/analytics";
import {
  createDefaultWeddingData,
  WeddingDetailsEditor,
  WeddingPosterEditor,
  WeddingRevealMusicEditor,
} from "@/components/wedding/WeddingCreatorFields";
import WeddingInvitation, { type WeddingInvitationData } from "@/components/wedding/WeddingInvitation";

const CREATE_DRAFT_STORAGE_PREFIX = "birthdayglow_create_draft_v1";

function createDraftStorageKey(userId: string): string {
  return `${CREATE_DRAFT_STORAGE_PREFIX}:${userId}`;
}

function isValidOptionalWebUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const PREVIEW_THEME_COMPONENTS: Record<string, ComponentType<any>> = {
  galaxy: GalaxyTheme,
  floral: FloralTheme,
  neon: NeonTheme,
  minimal: MinimalTheme,
  retro: RetroTheme,
  magical: MagicalTheme,
};

function resolveBackgroundMusicType(musicData: any): "none" | "preset" | "upload" {
  if (["none", "preset", "upload"].includes(musicData?.musicType)) return musicData.musicType;
  if (musicData?.musicUploadUrl) return "upload";
  if (musicData?.musicPresetId) return "preset";
  return "none";
}

// ─── Live Preview Modal ───────────────────────────────────────────────────────
// Renders the ACTUAL selected theme full-screen with the user's real content,
// overlaid with a watermark, so buyers experience their finished page before
// paying — the single biggest purchase trigger.
function LivePreviewModal({
  data,
  photos,
  musicData,
  occasionType,
  onClose,
}: {
  data: any;
  photos: string[];
  musicData: any;
  occasionType: OccasionType;
  onClose: () => void;
}) {
  const ThemeComp = PREVIEW_THEME_COMPONENTS[data.theme] ?? GalaxyTheme;
  const previewRef = useRef<HTMLDivElement>(null);

  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  const previewCelebration = {
    id: "preview",
    recipientName: data.recipientName || "Your Loved One",
    birthdayDate: data.birthdayDate || "2000-01-01",
    eventDate: data.birthdayDate || "2000-01-01",
    message: data.message || "Your heartfelt message will appear here 💌",
    theme: data.theme,
    photos: photos.length ? photos : [],
    occasionType,
    relation: data.relation,
    relationCustom: data.relationCustom,
    musicType: resolveBackgroundMusicType(musicData),
    musicPresetId: musicData?.musicPresetId,
    musicUploadUrl: musicData?.musicUploadUrl,
    voiceMessageUrl: musicData?.voiceMessageUrl || "",
    videoMessageUrl: musicData?.videoMessageUrl || "",
    expiresAt: oneYear.toISOString(),
    views: 0,
  };

  const weddingInvitation: WeddingInvitationData | null = occasionType === "wedding" ? {
    couple: {
      partnerOne: data.weddingData.partnerOne || "Partner One",
      partnerTwo: data.weddingData.partnerTwo || "Partner Two",
      monogram: `${data.weddingData.partnerOne?.charAt(0) || "A"} · ${data.weddingData.partnerTwo?.charAt(0) || "V"}`.toUpperCase(),
    },
    families: data.weddingData.families || "Together with their families",
    date: `${data.birthdayDate}T18:00:00+05:30`,
    location: data.weddingData.location,
    hashtag: data.weddingData.hashtag,
    heroImage: photos[0] || "",
    directionsUrl: data.weddingData.directionsUrl || `https://maps.google.com/?q=${encodeURIComponent(data.weddingData.location)}`,
    videoUrl: data.weddingData.videoUrl.trim() || undefined,
    whatsappNumber: data.weddingData.whatsappNumber,
    rsvpEnabled: data.weddingData.rsvpEnabled,
    rsvpDeadline: data.weddingData.rsvpDeadline,
    ceremonies: data.weddingData.ceremonies
      .filter((ceremony: WeddingDataDraft["ceremonies"][number]) => ceremony.selected)
      .map(({ selected: _selected, ...ceremony }: WeddingDataDraft["ceremonies"][number]) => ({
        ...ceremony,
        date: `${ceremony.date}T${ceremony.time}:00+05:30`,
        time: new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(`${ceremony.date}T${ceremony.time}:00+05:30`)),
      })),
  } : null;

  useEffect(() => {
    trackEvent("preview_viewed", { theme: data.theme, occasionType });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previewRef.current?.scrollTo({ top: 0, left: 0 });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [data.theme, occasionType]);

  return createPortal(
    <div ref={previewRef} className="fixed inset-0 z-[300] bg-black overflow-y-auto">
      {/* Watermark ribbon */}
      <div
        className="fixed top-0 left-0 right-0 z-[310] flex items-center justify-between px-4 py-2.5 text-sm"
        style={{ background: "rgba(10,6,18,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <span className="font-semibold text-white flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-bold" style={{ background: "linear-gradient(135deg,#ff8a5c,#ff5f93)" }}>
            LIVE PREVIEW
          </span>
          <span className="hidden sm:inline text-white/60">This is exactly what they&apos;ll see</span>
        </span>
        <button onClick={onClose} className="flex items-center gap-1.5 text-white/80 hover:text-white font-medium">
          <X size={16} /> Close
        </button>
      </div>

      {/* Diagonal watermark overlay so screenshots are discouraged pre-payment */}
      <div
        className="pointer-events-none fixed inset-0 z-[305] flex items-center justify-center overflow-hidden"
        style={{ backdropFilter: "blur(5px)", background: "rgba(0,0,0,0.01)" }}
      >
        <div
          className="text-white/[0.06] font-black whitespace-nowrap select-none"
          style={{ fontSize: "6rem", transform: "rotate(-30deg)", letterSpacing: "0.1em" }}
        >
          JUST4YOU.BUZZ · PREVIEW · JUST4YOU.BUZZ
        </div>
      </div>

      <div className="pt-11 select-none">
        {weddingInvitation ? <WeddingInvitation invitation={weddingInvitation} /> : <ThemeComp celebration={previewCelebration} />}
      </div>
    </div>,
    document.body,
  );
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepBar({ step, onStepChange }: { step: number; onStepChange: (step: number) => void }) {
  const steps = ["Occasion", "Details", "Photos", "Music", "Preview", "Pay"];
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {steps.map((label, index) => (
        <div key={label} className="flex items-center gap-1">
          {index < step ? (
            <button
              type="button"
              onClick={() => onStepChange(index)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover:border-green-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70"
              aria-label={`Go back to ${label}`}
              title={`Edit ${label}`}
            >
              <Check size={11} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ) : (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${index === step ? "border text-white" : "text-[var(--text-muted)] border border-transparent"}`}
              style={index === step ? { background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.5)" } : {}}
              aria-current={index === step ? "step" : undefined}
            >
              <span className="w-4 text-center">{index + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          )}
          {index < steps.length - 1 && (
            <div className="w-4 h-px" style={{ background: index < step ? "#22c55e" : "rgba(255,255,255,0.1)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 0: Choose Occasion ──────────────────────────────────────────────────
function StepOccasion({ selected, onSelect }: { selected: OccasionType; onSelect: (o: OccasionType) => void }) {
  return (
    <div className="space-y-6 step-enter">
      <label className="block text-base font-semibold text-center mb-6">What occasion are we celebrating? ✨</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OCCASIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            className={`p-6 rounded-2xl text-left transition-all duration-300 flex flex-col gap-3 relative ${selected === o.id ? "border glow-purple" : "glass border-transparent hover:border-purple-500/30"
              }`}
            style={{
              border: selected === o.id ? "1px solid rgba(168,85,247,0.6)" : undefined,
              background: selected === o.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
            }}
          >
            <div className="text-4xl">{o.emoji}</div>
            <div>
              <div className="font-bold text-lg">{o.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{o.description}</div>
            </div>
            {selected === o.id && <Check size={18} className="text-purple-400 absolute top-4 right-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Details ─────────────────────────────────────────────────────────
function Step1({ data, onChange, occasionType, features }: { data: any; onChange: (d: any) => void; occasionType: OccasionType; features: string[] }) {
  const occasion = OCCASIONS.find((o) => o.id === occasionType) ?? OCCASIONS[0];
  const relations = RELATION_BY_OCCASION[occasionType] ?? RELATION_BY_OCCASION.birthday;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const generateAI = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    trackEvent("ai_message_requested", { occasionType });
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setAiLoading(false);
        return;
      }
      const res = await fetch("/api/ai/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          occasionType,
          relation: data.relation,
          recipientName: data.recipientName,
          memories: data.message,
        }),
      });
      const json = await res.json();
      setAiSuggestions(Array.isArray(json.messages) ? json.messages : []);
    } catch {
      // ignore — user can still type their own
    } finally {
      setAiLoading(false);
    }
  };

  if (occasionType === "wedding") {
    return (
      <WeddingDetailsEditor
        value={data.weddingData}
        onChange={(weddingData) => onChange({
          ...data,
          weddingData,
          recipientName: `${weddingData.partnerOne} & ${weddingData.partnerTwo}`,
          relation: "couple",
          theme: "wedding",
        })}
        weddingDate={data.birthdayDate}
        onWeddingDateChange={(birthdayDate) => onChange({ ...data, birthdayDate })}
        message={data.message}
        onMessageChange={(message) => onChange({ ...data, message })}
      />
    );
  }

  return (
    <div className="space-y-6 step-enter">
      <div>
        <label className="block text-sm font-medium mb-2">Who is this for? *</label>
        <input
          id="recipient-name"
          type="text"
          value={data.recipientName}
          onChange={(e) => onChange({ ...data, recipientName: e.target.value })}
          placeholder={occasion.namePlaceholder}
          className="input-field text-lg"
          maxLength={50}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Relation with them *</label>
          <select
            id="recipient-relation"
            value={data.relation || ""}
            onChange={(e) => onChange({ ...data, relation: e.target.value })}
            className="input-field select-field bg-[#0a0612] text-white"
          >
            <option value="" disabled>Select relation...</option>
            {relations.map((r) => (
              <option key={r.id} value={r.id} className="bg-[#0a0612] text-white">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{occasion.dateLabel} *</label>
          <input
            id="birthday-date"
            type="date"
            value={data.birthdayDate}
            onChange={(e) => onChange({ ...data, birthdayDate: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {data.relation === "custom" && (
        <div className="step-enter">
          <label className="block text-sm font-medium mb-2">Specify Custom Relation *</label>
          <input
            id="custom-relation"
            type="text"
            value={data.relationCustom || ""}
            onChange={(e) => onChange({ ...data, relationCustom: e.target.value })}
            placeholder="e.g. Mentor, Bestie, Soul sister 🌟"
            className="input-field"
            maxLength={30}
          />
        </div>
      )}

      <div>
        <label className="flex items-center justify-between text-sm font-medium mb-2">
          <span>
            Your Personal Message *
            <span className="ml-2 text-xs text-[var(--text-muted)]">{data.message.length}/{MAX_MESSAGE_LENGTH}</span>
          </span>
          <button
            type="button"
            onClick={generateAI}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.2))", border: "1px solid rgba(168,85,247,0.4)", color: "#e9d5ff" }}
          >
            {aiLoading ? "Writing…" : "✨ Write with AI"}
          </button>
        </label>
        <textarea
          id="birthday-message"
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value.slice(0, MAX_MESSAGE_LENGTH) })}
          placeholder={occasion.messagePlaceholder}
          rows={5}
          className="input-field resize-none leading-relaxed"
        />
        {aiSuggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--text-muted)]">Tap a draft to use it — then edit freely:</p>
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onChange({ ...data, message: s.slice(0, MAX_MESSAGE_LENGTH) }); setAiSuggestions([]); }}
                className="w-full text-left p-3 rounded-xl text-sm leading-relaxed transition-all hover:brightness-125"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "var(--text-primary)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Countdown toggle (Countdown Reveal add-on) ── */}
      {features.includes("countdown") ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl glass border border-purple-500/20">
          {/* BUG-15 fix: accentColor inline ensures the purple tint renders even when
               the Tailwind `accent-purple-500` utility is purged from the production bundle. */}
          <input
            id="countdown-toggle"
            type="checkbox"
            checked={data.countdownEnabled ?? false}
            onChange={(e) => onChange({ ...data, countdownEnabled: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded accent-purple-500 cursor-pointer flex-shrink-0"
            style={{ accentColor: "#a855f7" }}
          />
          <div>
            <label htmlFor="countdown-toggle" className="block text-sm font-semibold cursor-pointer">
              🔒 Lock until event date (Countdown Mode)
            </label>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Visitors see an animated countdown — the surprise unlocks automatically on the day!
            </p>
          </div>
        </div>
      ) : (
        <Link
          href="/pricing"
          className="flex items-start gap-3 p-4 rounded-2xl glass border border-white/10 opacity-80 hover:opacity-100 transition-opacity"
        >
          <span className="text-lg">⏳</span>
          <div>
            <span className="block text-sm font-semibold">Countdown Reveal — not in your package</span>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Add the Countdown Reveal feature to lock the page until the big day. Tap to edit your package.
            </p>
          </div>
        </Link>
      )}

      <div>
        <label className="block text-sm font-medium mb-4">Choose a Theme *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              id={`theme-${t.id}`}
              onClick={() => onChange({ ...data, theme: t.id })}
              className={`p-4 rounded-2xl text-left transition-all duration-300 flex items-center gap-3 ${data.theme === t.id ? "border glow-purple" : "glass border-transparent hover:border-purple-500/30"
                }`}
              style={{
                border: data.theme === t.id ? "1px solid rgba(168,85,247,0.6)" : undefined,
                background: data.theme === t.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex gap-1">
                {t.preview.map((c, j) => (
                  <div key={j} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{t.label}</div>
                <div className="text-xs text-[var(--text-muted)] truncate">{t.description}</div>
              </div>
              {data.theme === t.id && <Check size={16} className="text-purple-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Wall of Love opt-in ── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl glass border border-purple-500/20">
        <input
          id="gallery-optin"
          type="checkbox"
          checked={data.isPublicOptIn ?? false}
          onChange={(e) => onChange({ ...data, isPublicOptIn: e.target.checked })}
          className="mt-0.5 w-4 h-4 rounded accent-purple-500 cursor-pointer flex-shrink-0"
          style={{ accentColor: "#a855f7" }}
        />
        <div>
          <label htmlFor="gallery-optin" className="block text-sm font-semibold cursor-pointer">
            💛 Feature on our public Wall of Love (optional)
          </label>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Let others discover your creation for inspiration. We review before anything goes public — you can opt out anytime.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl glass border border-amber-400/20">
        <input id="recovery-optin" type="checkbox" checked={data.recoveryOptIn ?? false} onChange={(event) => onChange({ ...data, recoveryOptIn: event.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-400" />
        <div><label htmlFor="recovery-optin" className="block cursor-pointer text-sm font-semibold">Email me this draft if I stop</label><p className="mt-0.5 text-xs text-[var(--text-muted)]">After 24 hours of inactivity, send one reminder with the recipient name and first preview photo. No discount spam.</p></div>
      </div>

      {/* ── Scheduled delivery (add-on) ── */}
      {features.includes("scheduled_delivery") && (
        <div className="p-4 rounded-2xl glass border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">⏰ Scheduled Delivery</div>
          <p className="text-xs text-[var(--text-muted)]">We'll email the surprise to your recipient at the exact moment you pick.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Deliver at</label>
              <input
                type="datetime-local"
                value={data.scheduledDeliveryAt || ""}
                onChange={(e) => onChange({ ...data, scheduledDeliveryAt: e.target.value })}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Recipient's email</label>
              <input
                type="email"
                value={data.recipientEmail || ""}
                onChange={(e) => onChange({ ...data, recipientEmail: e.target.value })}
                placeholder="them@example.com"
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Custom link (add-on) ── */}
      {features.includes("custom_link") && (
        <div className="p-4 rounded-2xl glass border border-purple-500/20 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">🔗 Custom Link</div>
          <p className="text-xs text-[var(--text-muted)]">Pick a memorable link instead of a random code.</p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-[var(--text-muted)]">just4you.buzz/p/</span>
            <input
              type="text"
              value={data.customLink || ""}
              onChange={(e) => onChange({ ...data, customLink: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 40) })}
              placeholder="priya-birthday"
              className="input-field text-sm flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Photos ───────────────────────────────────────────────────────────
function Step2({ photos, onPhotos, features, occasionType, weddingData, onWeddingChange }: { photos: string[]; onPhotos: (p: string[]) => void; features: string[]; occasionType: OccasionType; weddingData: WeddingDataDraft; onWeddingChange: (data: WeddingDataDraft) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number[]>([]);
  const isWedding = occasionType === "wedding";
  const photoLimit = isWedding ? 1 : photoLimitFor(features);

  const [uploadError, setUploadError] = useState<string | null>(null);

  // BUG-04: validate Cloudinary response — never push undefined into the photos array.
  const uploadToCloudinary = async (file: File, index: number): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append("folder", "birthdayglow");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) {
      throw new Error(`Cloudinary error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.secure_url) {
      throw new Error(data.error?.message ?? "Upload failed — no URL returned.");
    }
    return data.secure_url as string;
  };

  const handleFiles = async (files: FileList) => {
    const remaining = photoLimit - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setProgress(new Array(toUpload.length).fill(0));

    const urls: string[] = [];
    for (let i = 0; i < toUpload.length; i++) {
      try {
        const url = await uploadToCloudinary(toUpload[i], i);
        urls.push(url);
        setProgress((p) => p.map((v, j) => (j === i ? 100 : v)));
      } catch (err: any) {
        console.error("Photo upload failed:", err);
        setUploadError(`Failed to upload photo ${i + 1}: ${err.message}`);
        // Skip this file but continue uploading the rest
        setProgress((p) => p.map((v, j) => (j === i ? -1 : v)));
      }
    }
    if (urls.length > 0) onPhotos([...photos, ...urls]);
    setUploading(false);
    setProgress([]);
  };

  const removePhoto = (i: number) => {
    onPhotos(photos.filter((_, j) => j !== i));
  };

  return (
    <div className="space-y-6 step-enter">
      <div className="text-sm text-[var(--text-muted)]">
        {isWedding ? (
          <>
            Optionally upload one <strong className="text-white">9:16 wedding hero image</strong>. Uploaded artwork is shown by itself; without one, the couple names, date, and venue are displayed automatically.
          </>
        ) : (
          <>Upload up to <strong className="text-white">{photoLimit} photos</strong>. They&apos;ll appear in a beautiful animated slideshow.</>
        )}
        <span className="ml-2 font-semibold" style={{ color: photos.length >= photoLimit ? "#22c55e" : "#a855f7" }}>
          {photos.length}/{photoLimit} uploaded
        </span>
        {!isWedding && !features.includes("extra_photos") && (
          <Link href="/pricing" className="ml-2 text-purple-400 hover:text-purple-300 font-semibold">
            Need more? Add Extra Photos →
          </Link>
        )}
      </div>

      {photos.length < photoLimit && (
        <label
          id="photo-upload-area"
          className="block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300"
          style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.04)" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <input
            type="file"
            accept="image/*"
            multiple={!isWedding}
            className="sr-only"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.15)" }}>
              <Upload size={24} className="text-purple-400" />
            </div>
            <div>
              <div className="font-semibold text-sm">{isWedding ? "Upload wedding hero image" : "Drag & drop photos here"}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {isWedding ? "Portrait 9:16 recommended · use artwork without baked-in text" : "or click to browse — JPG, PNG, WEBP accepted"}
              </div>
            </div>
            {uploading && (
              <div className="w-full max-w-xs space-y-2">
                {progress.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-purple-400">{p}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </label>
      )}

      {/* BUG-04: surface upload errors to the user */}
      {uploadError && (
        <div className="text-sm text-red-400 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠️ {uploadError}
        </div>
      )}

      {photos.length > 0 && (
        <div className={isWedding ? "flex justify-center" : "grid grid-cols-2 sm:grid-cols-4 gap-3"}>
          {photos.map((url, i) => (
            <div key={i} className={`relative group rounded-xl overflow-hidden ${isWedding ? "w-40 aspect-[9/16] ring-1 ring-amber-400/30" : "aspect-square"}`}>
              <img src={url} alt={isWedding ? "Wedding hero preview" : `Photo ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                <button
                  onClick={() => removePhoto(i)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center transition-all duration-200"
                >
                  <X size={14} color="white" />
                </button>
              </div>
              <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-xs">
                {isWedding ? "H" : i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {occasionType === "wedding" && <WeddingPosterEditor value={weddingData} onChange={onWeddingChange} />}
    </div>
  );
}

// ─── Step 3: Music + Voice ────────────────────────────────────────────────────
function Step3({ musicData, onChange, features, occasionType, weddingData, onWeddingChange }: { musicData: any; onChange: (d: any) => void; features: string[]; occasionType: OccasionType; weddingData: WeddingDataDraft; onWeddingChange: (data: WeddingDataDraft) => void }) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Stop preview if tab changes
  useEffect(() => {
    if (musicData.musicType !== "preset" && previewTrackId) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPreviewTrackId(null);
    }
  }, [musicData.musicType, previewTrackId]);

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  const handleTrackClick = (track: any) => {
    if (musicData.musicPresetId === track.id) {
      // Toggle play/pause for the already selected track
      if (previewTrackId === track.id) {
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
        }
        setPreviewTrackId(null);
      } else {
        setPreviewTrackId(track.id);
        if (!audioPreviewRef.current) {
          audioPreviewRef.current = new Audio(track.url);
        } else {
          audioPreviewRef.current.src = track.url;
        }
        audioPreviewRef.current.loop = true;
        audioPreviewRef.current.play().catch((err) => console.error(err));
      }
    } else {
      // Select new track and play it
      onChange({ ...musicData, musicPresetId: track.id });
      setPreviewTrackId(track.id);
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(track.url);
      } else {
        audioPreviewRef.current.src = track.url;
      }
      audioPreviewRef.current.loop = true;
      audioPreviewRef.current.play().catch((err) => console.error(err));
    }
  };
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a stable ref to stopRecording so the interval callback is not stale.
  const stopRecordingRef = useRef<() => void>(() => { });

  // BUG-04 (audio): validate Cloudinary response for audio uploads too.
  const uploadAudio = async (file: File, isVoice = false) => {
    if (isVoice) setVoiceUploading(true); else setUploading(true);
    setAudioError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append("resource_type", "video");
      formData.append("folder", isVoice ? "birthdayglow/voice" : "birthdayglow/music");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message ?? "No URL returned from Cloudinary.");
      if (isVoice) {
        onChange({ ...musicData, voiceMessageUrl: data.secure_url });
      } else {
        onChange({ ...musicData, musicType: "upload", musicUploadUrl: data.secure_url });
      }
    } catch (err: any) {
      console.error("Audio upload failed:", err);
      setAudioError(err.message ?? "Upload failed. Please try again.");
    } finally {
      if (isVoice) setVoiceUploading(false); else setUploading(false);
    }
  };

  // Video message upload (reuses Cloudinary's video endpoint).
  const [videoUploading, setVideoUploading] = useState(false);
  const uploadVideo = async (file: File) => {
    if (file.size > 60 * 1024 * 1024) {
      setAudioError("Please choose a video under 60MB.");
      return;
    }
    setVideoUploading(true);
    setAudioError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append("resource_type", "video");
      formData.append("folder", "birthdayglow/video");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message ?? "No URL returned from Cloudinary.");
      onChange({ ...musicData, videoMessageUrl: data.secure_url });
    } catch (err: any) {
      console.error("Video upload failed:", err);
      setAudioError(err.message ?? "Upload failed. Please try again.");
    } finally {
      setVideoUploading(false);
    }
  };

  // BUG-05: stopRecording defined first so the interval callback can reference
  // it via a stable ref — avoids calling a stale closure from inside setState.
  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };
  stopRecordingRef.current = stopRecording;

  // BUG-05: cleanup interval + microphone stream when the component unmounts
  // (e.g. user navigates away mid-recording).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
        await uploadAudio(file, true);
      };
      mr.start();
      setRecording(true);
      setRecordingTime(0);
      // BUG-05: auto-stop logic lives in the interval body, not inside setState,
      // preventing the race where stopRecording() runs inside a state-updater batch.
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          const next = t + 1;
          if (next >= 60) {
            stopRecordingRef.current();
            return 60;
          }
          return next;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone permission or upload an audio file instead.");
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const backgroundMusicType = resolveBackgroundMusicType(musicData);
  const selectedTrack = PRESET_TRACKS.find((track) => track.id === musicData.musicPresetId);
  const mediaStatuses = [
    {
      id: "music",
      label: "Background music",
      detail: uploading
        ? "Uploading song..."
        : backgroundMusicType === "upload" && musicData.musicUploadUrl
          ? "Custom song ready"
          : backgroundMusicType === "preset"
            ? `${selectedTrack?.label ?? "Preset track"} ready`
            : "No music selected",
      ready: !uploading && (backgroundMusicType === "none" || backgroundMusicType === "preset" || Boolean(musicData.musicUploadUrl)),
      busy: uploading,
      icon: Music,
      visible: true,
    },
    {
      id: "voice",
      label: "Voice message",
      detail: voiceUploading ? "Uploading voice..." : musicData.voiceMessageUrl ? "Voice message ready" : "Not added yet",
      ready: Boolean(musicData.voiceMessageUrl),
      busy: voiceUploading,
      icon: Mic,
      visible: features.includes("voice_message") || Boolean(musicData.voiceMessageUrl),
    },
    {
      id: "video",
      label: "Video message",
      detail: videoUploading ? "Uploading video..." : musicData.videoMessageUrl ? "Video message ready" : "Not added yet",
      ready: Boolean(musicData.videoMessageUrl),
      busy: videoUploading,
      icon: Video,
      visible: features.includes("video_message") || Boolean(musicData.videoMessageUrl),
    },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-6 step-enter">
      {/* Music tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "none", label: "🔇 No Music", locked: false },
          { id: "preset", label: "🎵 Preset", locked: false },
          { id: "upload", label: "📤 Upload Song", locked: !features.includes("custom_music") },
          { id: "voice", label: "🎤 Voice Message", locked: !features.includes("voice_message") },
          { id: "video", label: "🎥 Video", locked: !features.includes("video_message") },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`music-${tab.id}`}
            onClick={() => {
              if (tab.locked) {
                window.location.href = "/pricing";
                return;
              }
              if (tab.id === "none") {
                onChange({ ...musicData, musicType: "none", musicPresetId: "", musicUploadUrl: "" });
              } else if (tab.id === "preset") {
                onChange({ ...musicData, musicType: "preset", musicUploadUrl: "" });
              } else {
                onChange({ ...musicData, musicType: tab.id });
              }
            }}
            title={tab.locked ? "Add this feature to your package" : undefined}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all min-w-fit ${musicData.musicType === tab.id ? "border text-white" : "glass text-[var(--text-muted)]"
              } ${tab.locked ? "opacity-50" : ""}`}
            style={musicData.musicType === tab.id ? { background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.5)" } : {}}
          >
            {tab.locked ? `🔒 ${tab.label}` : tab.label}
          </button>
        ))}
      </div>

      {musicData.musicType === "preset" && (
        <div className="space-y-2">
          <div className="text-sm text-[var(--text-muted)] mb-3">Choose a background track:</div>
          {PRESET_TRACKS.map((track) => (
            <button
              key={track.id} type="button" id={`track-${track.id}`}
              onClick={() => handleTrackClick(track)}
              className={`w-full p-4 rounded-xl text-left flex items-center gap-4 transition-all ${musicData.musicPresetId === track.id ? "border" : "glass border-transparent hover:border-purple-500/30"
                }`}
              style={musicData.musicPresetId === track.id ? { background: "rgba(168,85,247,0.15)", borderColor: "rgba(168,85,247,0.5)" } : {}}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleTrackClick(track);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-110 ${
                  previewTrackId === track.id ? "animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)] bg-purple-500/30" : "bg-purple-500/15 hover:bg-purple-500/25"
                }`}
              >
                {previewTrackId === track.id ? (
                  <Pause size={16} className="text-purple-400" />
                ) : (
                  <Play size={16} className="text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{track.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{track.mood}</div>
              </div>
              {musicData.musicPresetId === track.id && <Check size={16} className="text-purple-400" />}
            </button>
          ))}
        </div>
      )}

      {musicData.musicType === "upload" && (
        <div>
          <div className="text-sm text-[var(--text-muted)] mb-3">Upload your song (MP3, max 10MB):</div>
          <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer" style={{ borderColor: "rgba(168,85,247,0.3)" }}>
            <input type="file" accept="audio/*" className="sr-only"
              onChange={(e) => e.target.files?.[0] && uploadAudio(e.target.files[0])}
              disabled={uploading} />
            {musicData.musicUploadUrl ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">✅</div>
                <div className="text-sm font-semibold text-green-400">Song uploaded!</div>
                <div className="text-xs text-[var(--text-muted)]">Click to replace</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} className="text-purple-400" />
                <div className="text-sm font-semibold">{uploading ? "Uploading..." : "Upload your song"}</div>
              </div>
            )}
          </label>
        </div>
      )}

      {/* ── Voice Message Tab ── */}
      {musicData.musicType === "voice" && (
        <div className="space-y-4">
          <div className="text-sm text-[var(--text-muted)]">
            Record a heartfelt voice message (max 60 sec) or upload an audio file.
          </div>

          {/* Recorder UI */}
          <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
            {recording ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center animate-pulse">
                    <Mic size={28} className="text-red-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-ping" />
                </div>
                <div className="font-mono text-2xl font-bold text-red-400">{formatTime(recordingTime)}</div>
                <div className="text-sm text-[var(--text-muted)]">Recording... (auto-stops at 1:00)</div>
                <button
                  id="stop-recording"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white"
                  style={{ background: "rgba(239,68,68,0.8)" }}
                >
                  <Square size={14} /> Stop Recording
                </button>
              </div>
            ) : voiceUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-3xl animate-spin">⏳</div>
                <div className="text-sm font-semibold text-purple-400">Uploading voice message...</div>
              </div>
            ) : musicData.voiceMessageUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">🎤✅</div>
                <div className="text-sm font-semibold text-green-400">Voice message uploaded!</div>
                <audio controls src={musicData.voiceMessageUrl} className="w-full max-w-xs" />
                <button
                  onClick={() => onChange({ ...musicData, voiceMessageUrl: "" })}
                  className="text-xs text-red-400 hover:underline"
                >Remove & re-record</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                  <Mic size={28} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Record a Voice Message</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Your loved one will hear your voice on the surprise page 💖</div>
                </div>
                <button
                  id="start-recording"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                >
                  <Mic size={15} /> Start Recording
                </button>
              </div>
            )}
          </div>

          {/* Or upload */}
          {!musicData.voiceMessageUrl && !recording && (
            <div>
              <div className="text-xs text-center text-[var(--text-muted)] my-3">— or upload an audio file —</div>
              <label className="block border border-dashed rounded-xl p-4 text-center cursor-pointer" style={{ borderColor: "rgba(168,85,247,0.3)" }}>
                <input type="file" accept="audio/*" className="sr-only"
                  onChange={(e) => e.target.files?.[0] && uploadAudio(e.target.files[0], true)}
                  disabled={voiceUploading} />
                <Upload size={18} className="text-purple-400 mx-auto mb-1" />
                <div className="text-xs text-[var(--text-muted)]">Upload WAV / MP3 / OGG</div>
              </label>
            </div>
          )}
        </div>
      )}

      {musicData.musicType === "video" && (
        <div className="space-y-4">
          {musicData.videoMessageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-purple-500/30">
              <video src={musicData.videoMessageUrl} controls playsInline className="w-full" style={{ maxHeight: 320, background: "#000" }} />
              <div className="p-3 text-center">
                <button onClick={() => onChange({ ...musicData, videoMessageUrl: "" })} className="text-xs text-red-400 hover:underline">
                  Remove & upload another
                </button>
              </div>
            </div>
          ) : (
            <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer" style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.04)" }}>
              <input type="file" accept="video/*" className="sr-only"
                onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
                disabled={videoUploading} />
              <div className="text-4xl mb-2">🎥</div>
              <div className="font-semibold text-sm">{videoUploading ? "Uploading…" : "Upload a video message"}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">MP4 / MOV up to 60MB — it plays inside their surprise page.</div>
            </label>
          )}
        </div>
      )}
      {occasionType !== "wedding" && (
        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]" aria-label="Your selected media">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-white">Your media</div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">Everything added to this surprise stays visible here.</div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-emerald-300">{mediaStatuses.filter((item) => item.ready).length}/{mediaStatuses.length} ready</span>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.08] sm:flex-row sm:divide-x sm:divide-y-0">
            {mediaStatuses.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                  <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.ready ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-white/40"}`}>
                    <Icon size={17} />
                    {item.ready && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[#102219]"><Check size={10} strokeWidth={3} /></span>}
                    {item.busy && <span className="absolute inset-0 animate-pulse rounded-lg ring-1 ring-purple-400/60" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-white/80">{item.label}</span>
                    <span className={`mt-0.5 block truncate text-xs ${item.ready ? "text-emerald-300/80" : item.busy ? "text-purple-300" : "text-white/35"}`}>{item.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {occasionType === "wedding" && <WeddingRevealMusicEditor value={weddingData} onChange={onWeddingChange} />}
    </div>
  );
}

// ─── Step 4: Preview ──────────────────────────────────────────────────────────
function Step4({ data, photos, occasionType, features, priceInr, pricing, onEditWeddingDetails }: { data: any; photos: string[]; occasionType: OccasionType; features: string[]; priceInr: number; pricing: PricingSettings; onEditWeddingDetails: () => void }) {
  const theme = THEMES.find((t) => t.id === data.theme) ?? THEMES[0];
  const track = PRESET_TRACKS.find((t) => t.id === data.musicData?.musicPresetId);
  const occasion = OCCASIONS.find((o) => o.id === occasionType) ?? OCCASIONS[0];
  const [showLivePreview, setShowLivePreview] = useState(false);
  const selectedWeddingCeremonies = data.weddingData?.ceremonies.filter((ceremony: WeddingDataDraft["ceremonies"][number]) => ceremony.selected) ?? [];
  const weddingBreakdown = weddingPriceBreakdown({
    ceremonyCount: selectedWeddingCeremonies.length,
    rsvpEnabled: Boolean(data.weddingData?.rsvpEnabled),
    customMusicCount: selectedWeddingCeremonies.filter((ceremony: WeddingDataDraft["ceremonies"][number]) => ceremony.revealMusicUrl).length,
  }, pricing);

  return (
    <div className="space-y-6 step-enter">
      {showLivePreview && (
        <LivePreviewModal
          data={data}
          photos={photos}
          musicData={data.musicData}
          occasionType={occasionType}
          onClose={() => setShowLivePreview(false)}
        />
      )}
      <div className="text-sm text-[var(--text-muted)]">Here's a preview of your {occasion.label} website:</div>
      <div className={`rounded-3xl overflow-hidden p-8 text-center relative min-h-64 flex flex-col items-center justify-center gap-4`}
        style={{
          background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})`,
          color: theme.preview[2] || "#ffffff",
          boxShadow: `0 0 60px ${theme.preview[1]}40`,
        }}>
        <div className="text-5xl font-bold font-playfair" style={{ color: theme.preview[2] || "#ffffff" }}>
          {occasionType === "wedding"
            ? `${data.weddingData.partnerOne || "Partner One"} & ${data.weddingData.partnerTwo || "Partner Two"} — Wedding Invitation`
            : occasionType === "proposal"
              ? "Will You Marry Me? 💍"
              : occasionType === "anniversary"
                ? `Happy Anniversary, ${data.recipientName || "..."}! 💍`
                : `Happy Birthday, ${data.recipientName || "..."}! 🎂`}
        </div>
        {data.message && <p className="text-sm opacity-80 max-w-md">{data.message.slice(0, 100)}{data.message.length > 100 ? "..." : ""}</p>}
        {photos.length > 0 && (
          <div className="flex gap-2 mt-2">
            {photos.slice(0, 4).map((url, i) => (
              <img key={i} src={url} className="w-14 h-14 rounded-xl object-cover border-2 border-white/30" />
            ))}
            {photos.length > 4 && <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-xs">+{photos.length - 4}</div>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: "Occasion", value: occasion.label },
          { label: "Theme", value: theme.label },
          {
            label: occasionType === "wedding" ? "Ceremonies" : "Photos",
            value: occasionType === "wedding"
              ? `${data.weddingData.ceremonies.filter((ceremony: WeddingDataDraft["ceremonies"][number]) => ceremony.selected).length} posters`
              : `${photos.length}/${photoLimitFor(features)}`,
          },
          {
            label: "Music", value:
              occasionType === "wedding"
                ? `${data.weddingData.ceremonies.filter((ceremony: WeddingDataDraft["ceremonies"][number]) => ceremony.selected && ceremony.revealMusicUrl).length} reveal tracks`
                : resolveBackgroundMusicType(data.musicData) === "preset" ? (track?.label ?? "Selected") :
                resolveBackgroundMusicType(data.musicData) === "upload" ? "Custom song" :
                  "No music"
          },
          ...(occasionType !== "wedding" && data.musicData?.voiceMessageUrl ? [{ label: "Voice message", value: "Added and ready" }] : []),
          ...(occasionType !== "wedding" && data.musicData?.videoMessageUrl ? [{ label: "Video message", value: "Added and ready" }] : []),
        ].map((item) => (
          <div key={item.label} className="glass-card p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
            <div className="font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      {occasionType === "wedding" && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-100">Wedding video & QR</div>
              {data.weddingData.videoUrl.trim() ? (
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Video link added. Its QR code appears near the end of the full invitation preview.
                </p>
              ) : (
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  No video link added. Paste a public YouTube, Vimeo, Google Drive, or direct video link in Wedding Details.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onEditWeddingDetails}
              className="shrink-0 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/15"
            >
              {data.weddingData.videoUrl.trim() ? "Change video link" : "Add video link"}
            </button>
          </div>
          <p className="mt-4 border-t border-amber-400/15 pt-3 text-xs leading-5 text-white/45">
            The separate QR code for sharing the complete invitation is generated after payment, when the final live website link exists.
          </p>
        </div>
      )}

      {/* Package total */}
      <div className="rounded-2xl p-5 glass border border-purple-500/20 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">
            {occasionType === "wedding" ? "Itemized wedding invitation" : features.length === 0 ? "Base website" : `Base + ${features.length} add-on${features.length > 1 ? "s" : ""}`}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {occasionType === "wedding"
              ? weddingBreakdown.map((item) => `${item.label} ${formatInr(item.amountInr)}`).join(" · ")
              : features.length > 0
                ? FEATURE_ADDONS.filter((a) => features.includes(a.id)).map((a) => a.label).join(" · ")
                : BASE_PACKAGE.label}
          </div>
        </div>
        <div className="text-2xl font-bold gradient-text">{formatInr(priceInr)}</div>
      </div>

      <button
        type="button"
        onClick={() => setShowLivePreview(true)}
        className="btn-primary w-full justify-center py-3.5"
      >
        <Play size={16} /> Preview the full experience
      </button>
      <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-200">
        <EyeOff size={16} className="shrink-0" />
        <span><strong>Preview notice:</strong> The full preview is intentionally blurred. Your activated website will be completely clear.</span>
      </div>
    </div>
  );
}

// ─── Step 5: Payment ─────────────────────────────────────────────────────────
interface CheckoutPreview {
  basePaise: number;
  amountPaise: number;
  referralDiscountPaise: number;
  walletAppliedInr: number;
  freeAddonFeatureId: string | null;
  freeAddonDiscountPaise: number;
}

function Step5({ celebrationId, onSuccess, occasionType, priceInr }: { celebrationId: string; onSuccess: (slug: string) => void; occasionType: OccasionType; priceInr: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [benefitPreview, setBenefitPreview] = useState<CheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const occasion = OCCASIONS.find((o) => o.id === occasionType) ?? OCCASIONS[0];

  const isRedirectMode = !!process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL;
  const finalAmountInr = Math.round((benefitPreview?.amountPaise ?? priceInr * 100) / 100);
  const totalBenefitPaise = benefitPreview
    ? Math.max(0, benefitPreview.basePaise - benefitPreview.amountPaise)
    : 0;
  const hasAutomaticBenefits = totalBenefitPaise > 0;
  const freeAddonLabel = FEATURE_ADDONS.find((addon) => addon.id === benefitPreview?.freeAddonFeatureId)?.label;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError("");
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/payment/benefits-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ celebrationId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "Unable to calculate referral benefits.");
        if (!cancelled) setBenefitPreview(result as CheckoutPreview);
      } catch (previewFailure: any) {
        if (!cancelled) setPreviewError(previewFailure?.message ?? "Unable to calculate referral benefits.");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    void loadPreview();
    return () => { cancelled = true; };
  }, [celebrationId, previewRetryKey, user]);

  // Load Razorpay checkout script dynamically (JSX <script> tag doesn't execute reliably)
  useEffect(() => {
    if (isRedirectMode) return;
    if ((window as any).Razorpay) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Failed to load payment gateway. Please refresh and try again.");
    document.body.appendChild(script);
  }, [isRedirectMode]);

  const handlePay = async () => {
    if (!isRedirectMode && !scriptReady) {
      setError("Payment gateway is still loading. Please wait a moment and try again.");
      return;
    }
    if (!benefitPreview) {
      setError("Referral benefits are still being calculated. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    // BUG-14: track when payment verification has started so ondismiss doesn't
    // reset loading after the handler fires (avoiding a double-submit window).
    const paymentDone = { current: false };
    try {
      const token = await user!.getIdToken();

      const checkoutEndpoint = isRedirectMode ? "/api/payment/create-link" : "/api/payment/create-order";
      const orderRes = await fetch(checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ celebrationId }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        console.error("create-order error:", errData);
        setError(errData.error ?? `Server error (${orderRes.status}). Please try again.`);
        setLoading(false);
        return;
      }

      const checkout = await orderRes.json();
      const confirmedPreview: CheckoutPreview = {
        basePaise: benefitPreview.basePaise,
        amountPaise: checkout.amount,
        referralDiscountPaise: checkout.referralDiscountPaise ?? 0,
        walletAppliedInr: checkout.walletAppliedInr ?? checkout.referralCreditAppliedInr ?? 0,
        freeAddonFeatureId: checkout.freeAddonFeatureId ?? null,
        freeAddonDiscountPaise: checkout.freeAddonDiscountPaise ?? 0,
      };
      setBenefitPreview(confirmedPreview);

      if (checkout.amount !== benefitPreview.amountPaise) {
        setError("Your referral balance changed. Please review the updated amount and tap Pay again.");
        setLoading(false);
        return;
      }

      if (isRedirectMode) {
        localStorage.setItem("pending_celebration_id", celebrationId);
        window.location.href = checkout.paymentUrl;
        return;
      }

      const { orderId, amount, currency, keyId } = checkout;

      // Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Just4You",
        description: `${occasion.label} Website — ${formatInr(Math.round(amount / 100))}`,
        image: "/logo.png",
        order_id: orderId,
        handler: async (response: any) => {
          // Mark payment as in-progress so ondismiss won't interfere.
          paymentDone.current = true;
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...response, celebrationId }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            onSuccess(result.slug);
          } else {
            setError("Payment verified but website creation failed. Contact support.");
            setLoading(false);
          }
        },
        prefill: { email: user?.email ?? "", name: user?.displayName ?? "" },
        theme: { color: "#a855f7" },
        modal: {
          // BUG-14: only reset loading if the user dismissed WITHOUT completing
          // payment — paymentDone guards against the handler+ondismiss race.
          ondismiss: () => { if (!paymentDone.current) setLoading(false); },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 step-enter">
      <div className="glass-card p-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold font-playfair mb-2">Almost there!</h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">Review your referral benefits before activating your {occasion.label.toLowerCase()} website.</p>

        {previewLoading && (
          <div className="text-sm p-4 rounded-xl mb-6 text-[var(--text-muted)] border border-white/10 bg-white/[0.03]">
            Calculating your referral benefits...
          </div>
        )}
        {!previewLoading && previewError && (
          <div className="text-sm text-red-300 p-4 rounded-xl mb-6 border border-red-500/20 bg-red-500/10">
            <p>{previewError}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => setPreviewRetryKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        )}
        {!previewLoading && benefitPreview && (
          <div className="rounded-2xl p-5 mb-6 text-left border border-purple-500/20 bg-white/[0.03]">
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>Package total</span>
              <span>{formatInr(Math.round(benefitPreview.basePaise / 100))}</span>
            </div>
            {benefitPreview.referralDiscountPaise > 0 && (
              <div className="flex items-center justify-between text-sm mt-3 text-green-400">
                <span>Friend referral discount</span>
                <span>-{formatInr(Math.round(benefitPreview.referralDiscountPaise / 100))}</span>
              </div>
            )}
            {benefitPreview.walletAppliedInr > 0 && (
              <div className="flex items-center justify-between text-sm mt-3 text-green-400">
                <span>Wallet balance used</span>
                <span>-{formatInr(benefitPreview.walletAppliedInr)}</span>
              </div>
            )}
            {benefitPreview.freeAddonDiscountPaise > 0 && (
              <div className="flex items-center justify-between gap-4 text-sm mt-3 text-green-400">
                <span>Free add-on credit{freeAddonLabel ? ` (${freeAddonLabel})` : ""}</span>
                <span className="shrink-0">-{formatInr(Math.round(benefitPreview.freeAddonDiscountPaise / 100))}</span>
              </div>
            )}
            {hasAutomaticBenefits && (
              <div className="flex items-center justify-between text-sm font-semibold mt-4 pt-4 border-t border-white/10 text-green-400">
                <span>Total savings</span>
                <span>-{formatInr(Math.round(totalBenefitPaise / 100))}</span>
              </div>
            )}
            <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-white/10">
              <span className="font-semibold">Online amount to pay</span>
              <span className="text-3xl font-bold gradient-text">{formatInr(finalAmountInr)}</span>
            </div>
            {benefitPreview.walletAppliedInr > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                Your available wallet balance is applied automatically. Pay only the remaining {formatInr(finalAmountInr)} through Razorpay.
              </p>
            )}
          </div>
        )}
        <div className="text-xs text-[var(--text-muted)] mb-6">One-time payment • 1 year validity • Instant delivery</div>
        {error && (
          <div className="text-sm text-red-400 p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}
        <button
          id="pay-button"
          onClick={handlePay}
          disabled={loading || previewLoading || !benefitPreview || (!isRedirectMode && !scriptReady)}
          className="btn-primary w-full justify-center py-4 text-base glow-purple disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CreditCard size={20} />
          {previewLoading ? "Calculating benefits..." : !isRedirectMode && !scriptReady ? "Loading payment..." : loading ? "Opening payment..." : `Pay ${formatInr(finalAmountInr)} & Go Live!`}
        </button>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
          <span>🔒 Secured by Razorpay</span>
          <span>📱 UPI, Cards, PhonePe</span>
        </div>
      </div>
    </div>
  );
}


// ─── Main Create Page ─────────────────────────────────────────────────────────
export default function CreatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { pricing } = usePricingSettings();
  const [step, setStep] = useState(0);
  const [occasionType, setOccasionType] = useState<OccasionType>("birthday");
  const [celebrationId, setCelebrationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipientName: "",
    birthdayDate: "",
    message: "",
    theme: "galaxy" as Theme,
    relation: "",
    relationCustom: "",
    countdownEnabled: false,
    isPublicOptIn: false,
    recoveryOptIn: false,
    scheduledDeliveryAt: "",
    recipientEmail: "",
    customLink: "",
    weddingData: createDefaultWeddingData(),
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [musicData, setMusicData] = useState({ musicType: "preset", musicPresetId: "t1", musicUploadUrl: "", voiceMessageUrl: "", videoMessageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Paid features chosen on the /pricing cart. Drives feature gating + price.
  const [features, setFeatures] = useState<FeatureId[]>([]);

  // Funnel: mark the start of a create session once per mount.
  useEffect(() => {
    if (!user) return;
    trackEvent("create_started");
    setFeatures(loadCartFeatures());
    const requestedOccasion = new URLSearchParams(window.location.search).get("occasion");
    const occasion = OCCASIONS.find((item) => item.id === requestedOccasion);

    try {
      const storedDraft = localStorage.getItem(createDraftStorageKey(user.uid));
      if (storedDraft) {
        const draft = JSON.parse(storedDraft);
        const draftOccasion = OCCASIONS.find((item) => item.id === draft.occasionType);
        const canRestore = draft.version === 1
          && draftOccasion
          && (!occasion || occasion.id === draftOccasion.id)
          && draft.formData;

        if (canRestore) {
          const defaultWeddingData = createDefaultWeddingData();
          const restoredWeddingData = draft.formData.weddingData ?? {};
          setStep(draft.step === 5 && draft.celebrationId ? 5 : Math.min(Math.max(Number(draft.step) || 0, 0), 4));
          setOccasionType(draftOccasion.id);
          setCelebrationId(typeof draft.celebrationId === "string" ? draft.celebrationId : null);
          setFormData((current) => ({
            ...current,
            ...draft.formData,
            weddingData: {
              ...defaultWeddingData,
              ...restoredWeddingData,
              ceremonies: Array.isArray(restoredWeddingData.ceremonies)
                ? restoredWeddingData.ceremonies
                : defaultWeddingData.ceremonies,
            },
          }));
          setPhotos(Array.isArray(draft.photos) ? draft.photos.filter((photo: unknown) => typeof photo === "string") : []);
          setMusicData((current) => ({ ...current, ...(draft.musicData ?? {}) }));
          setLastSavedAt(draft.savedAt ? new Date(draft.savedAt) : null);
          setDraftReady(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Could not restore creation draft:", error);
      localStorage.removeItem(createDraftStorageKey(user.uid));
    }

    if (occasion) {
      setOccasionType(occasion.id);
      setFormData((current) => ({
        ...current,
        theme: occasion.defaultTheme,
        relation: occasion.id === "wedding" ? "couple" : "",
      }));
    }
    setDraftReady(true);
  }, [user]);

  useEffect(() => {
    if (!user || !draftReady) return;

    const saveTimer = window.setTimeout(() => {
      const savedAt = new Date();
      try {
        localStorage.setItem(createDraftStorageKey(user.uid), JSON.stringify({
          version: 1,
          savedAt: savedAt.toISOString(),
          step,
          occasionType,
          celebrationId,
          formData,
          photos,
          musicData,
        }));
        setLastSavedAt(savedAt);
      } catch (error) {
        console.warn("Could not auto-save creation draft:", error);
      }
    }, 400);

    return () => window.clearTimeout(saveTimer);
  }, [user, draftReady, step, occasionType, celebrationId, formData, photos, musicData]);

  const recoveryWasEnabled = useRef(false);
  useEffect(() => {
    if (!user || !draftReady) return;
    const enabled = formData.recoveryOptIn === true;
    const timer = window.setTimeout(async () => {
      if (!enabled && !recoveryWasEnabled.current) return;
      try {
        const token = await user.getIdToken();
        await fetch("/api/draft-recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(enabled ? {
            action: "sync",
            consent: true,
            recipientName: formData.recipientName,
            occasionType,
            theme: formData.theme,
            photoUrl: photos[0] ?? "",
            celebrationId: celebrationId ?? "",
            step,
          } : { action: "disable" }),
        });
        recoveryWasEnabled.current = enabled;
      } catch (error) {
        console.warn("Could not sync draft recovery preference:", error);
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [user, draftReady, formData.recoveryOptIn, formData.recipientName, formData.theme, occasionType, photos, celebrationId, step]);

  const saveDraftNow = () => {
    if (!user) return;
    const savedAt = new Date();
    try {
      localStorage.setItem(createDraftStorageKey(user.uid), JSON.stringify({
        version: 1,
        savedAt: savedAt.toISOString(),
        step,
        occasionType,
        celebrationId,
        formData,
        photos,
        musicData,
      }));
      setLastSavedAt(savedAt);
    } catch (error) {
      console.error("Could not save creation draft:", error);
      alert("This draft could not be saved on this device. Please check your browser storage settings.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
    }
  }, [authLoading, user, router]);

  const selectedWeddingCeremonies = formData.weddingData.ceremonies.filter((ceremony) => ceremony.selected);
  const weddingCustomMusicCount = selectedWeddingCeremonies.filter((ceremony) => ceremony.revealMusicUrl).length;
  const activeFeatures = occasionType === "wedding" ? [] : features;
  const hasFeature = (id: FeatureId) => activeFeatures.includes(id);
  const priceInr = occasionType === "wedding"
    ? computeWeddingPriceInr({ ceremonyCount: selectedWeddingCeremonies.length, rsvpEnabled: formData.weddingData.rsvpEnabled, customMusicCount: weddingCustomMusicCount }, pricing)
    : computePriceInr(activeFeatures, pricing);

  const canProceed = (() => {
    if (step === 0) return !!occasionType;
    if (step === 1) {
      if (occasionType === "wedding") {
        const wedding = formData.weddingData;
        const selectedCeremonies = wedding.ceremonies.filter((ceremony) => ceremony.selected);
        return Boolean(
          wedding.partnerOne.trim()
          && wedding.partnerTwo.trim()
          && wedding.families.trim()
          && wedding.location.trim()
          && isValidOptionalWebUrl(wedding.videoUrl)
          && (!wedding.rsvpEnabled || wedding.whatsappNumber.trim())
          && formData.birthdayDate
          && formData.message.trim()
          && selectedCeremonies.length > 0
          && selectedCeremonies.length <= MAX_WEDDING_CEREMONIES
          && selectedCeremonies.every((ceremony) => ceremony.date && ceremony.time && ceremony.venue.trim())
        );
      }
      const basic = formData.recipientName.trim() && formData.birthdayDate && formData.message.trim() && formData.theme && formData.relation;
      if (!basic) return false;
      if (formData.relation === "custom") {
        return !!formData.relationCustom?.trim();
      }
      return true;
    }
    if (step === 2) {
      if (occasionType === "wedding") {
        return formData.weddingData.ceremonies
          .filter((ceremony) => ceremony.selected)
          .every((ceremony) => Boolean(ceremony.image));
      }
      return photos.length > 0;
    }
    // BUG-06: each music type requires its own condition — the old ternary incorrectly
    // allowed proceeding with no voice message when musicType was "voice".
    if (step === 3) {
      if (musicData.musicType === "none") return true;
      if (musicData.musicType === "preset") return !!musicData.musicPresetId;
      if (musicData.musicType === "upload") return !!musicData.musicUploadUrl;
      if (musicData.musicType === "voice") return !!musicData.voiceMessageUrl;
      if (musicData.musicType === "video") return !!musicData.videoMessageUrl;
      return false;
    }
    return true;
  })();

  const saveAndProceed = async () => {
    if (step === 4) {
      if (!user) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }
      // Save celebration to Firestore before payment
      setSaving(true);
      try {
        const selectedWeddingCeremonies = formData.weddingData.ceremonies.filter((ceremony) => ceremony.selected);
        const backgroundMusicType = resolveBackgroundMusicType(musicData);
        const weddingData = occasionType === "wedding" ? {
          couple: {
            partnerOne: formData.weddingData.partnerOne.trim(),
            partnerTwo: formData.weddingData.partnerTwo.trim(),
            monogram: `${formData.weddingData.partnerOne.trim().charAt(0)} · ${formData.weddingData.partnerTwo.trim().charAt(0)}`.toUpperCase(),
          },
          families: formData.weddingData.families.trim(),
          date: `${formData.birthdayDate}T18:00:00+05:30`,
          location: formData.weddingData.location.trim(),
          hashtag: formData.weddingData.hashtag || `#${formData.weddingData.partnerOne}${formData.weddingData.partnerTwo}`.replace(/\s/g, "").toUpperCase(),
          heroImage: photos[0] || "",
          directionsUrl: formData.weddingData.directionsUrl || `https://maps.google.com/?q=${encodeURIComponent(formData.weddingData.location)}`,
          videoUrl: formData.weddingData.videoUrl.trim() || null,
          whatsappNumber: formData.weddingData.whatsappNumber,
          rsvpEnabled: formData.weddingData.rsvpEnabled,
          rsvpDeadline: formData.weddingData.rsvpDeadline,
          ceremonies: selectedWeddingCeremonies.map(({ selected: _selected, ...ceremony }) => ({
            ...ceremony,
            date: `${ceremony.date}T${ceremony.time}:00+05:30`,
            time: new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(`${ceremony.date}T${ceremony.time}:00+05:30`)),
          })),
        } : null;
        const draftData = {
          recipientName: formData.recipientName,
          birthdayDate: formData.birthdayDate, // deprecated backward compatibility
          eventDate: formData.birthdayDate, // dynamic eventDate field
          message: formData.message,
          theme: formData.theme,
          relation: formData.relation,
          relationCustom: formData.relation === "custom" ? formData.relationCustom : "",
          occasionType,
          weddingData,
          photos,
          countdownEnabled: hasFeature("countdown") ? (formData.countdownEnabled ?? false) : false,
          // Wall of Love: creator opt-in; admin approves before it appears publicly.
          isPublicOptIn: formData.isPublicOptIn ?? false,
          galleryApproved: false,
          // Scheduled delivery (only when the add-on is purchased).
          scheduledDeliveryAt: hasFeature("scheduled_delivery") && formData.scheduledDeliveryAt
            ? new Date(formData.scheduledDeliveryAt).toISOString()
            : null,
          recipientEmail: hasFeature("scheduled_delivery") ? (formData.recipientEmail || "") : "",
          deliveredAt: null,
          // Custom memorable link (only when the add-on is purchased).
          vanitySlug: hasFeature("custom_link") && formData.customLink ? formData.customLink : "",
          // Background music, voice, and video are independent media choices.
          musicType: backgroundMusicType,
          musicPresetId: backgroundMusicType === "preset" ? (musicData.musicPresetId ?? "") : "",
          musicUploadUrl: backgroundMusicType === "upload" ? (musicData.musicUploadUrl ?? "") : "",
          voiceMessageUrl: musicData.voiceMessageUrl ?? "",
          videoMessageUrl: musicData.videoMessageUrl ?? "",
          // Selected paid features + a display copy of the price. The charged
          // amount is always recomputed server-side from selectedFeatures.
          selectedFeatures: activeFeatures,
          weddingPricing: occasionType === "wedding" ? {
            ceremonyCount: selectedWeddingCeremonies.length,
            rsvpEnabled: formData.weddingData.rsvpEnabled,
            customMusicCount: weddingCustomMusicCount,
          } : null,
          pricePaise: occasionType === "wedding" ? priceInr * 100 : computePricePaise(activeFeatures, pricing),
        };

        if (celebrationId) {
          await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, celebrationId), draftData);
        } else {
          const docRef = await addDoc(collection(db, COLLECTIONS.CELEBRATIONS), {
            ...draftData,
            userId: user.uid,
            paymentStatus: "pending",
            isActive: false,
            isBlocked: false,
            views: 0,
            razorpayOrderId: "",
            slug: "",
            createdAt: serverTimestamp(),
            expiresAt: null,
          });
          setCelebrationId(docRef.id);
        }
        setStep(5);
        trackEvent("checkout_started", { occasionType, theme: formData.theme });
      } catch (err) {
        console.error("Firestore save error:", err);
        alert("Failed to save celebration. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      trackEvent("create_step_completed", { step });
      setStep((s) => s + 1);
    }
  };

  if (step === 6) {
    // Success — handled by onSuccess callback
    return null;
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-purple-400" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">Checking your account...</p>
        </div>
      </main>
    );
  }

  const currentOccasion = OCCASIONS.find(o => o.id === occasionType) ?? OCCASIONS[0];

  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg-deep)" }}>
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-playfair gradient-text">Create Your Perfect Celebration</h1>
          <p className="text-sm text-[var(--text-muted)]">Customize your interactive website</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Package summary — reflects the cart chosen on /pricing */}
        <div className="mb-6 flex items-center justify-between rounded-2xl px-5 py-3.5 glass border border-purple-500/20">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Your package:</span>
            <span className="text-[var(--text-muted)]">
              {occasionType === "wedding"
                ? `${selectedWeddingCeremonies.length} ${selectedWeddingCeremonies.length === 1 ? "ceremony" : "ceremonies"}${formData.weddingData.rsvpEnabled ? " + RSVP" : ""}${weddingCustomMusicCount ? ` + ${weddingCustomMusicCount} custom ${weddingCustomMusicCount === 1 ? "track" : "tracks"}` : ""}`
                : features.length === 0
                  ? "Base website"
                  : `Base + ${features.length} extra${features.length > 1 ? "s" : ""}`}
            </span>
            <span className="font-bold gradient-text ml-1">{formatInr(priceInr)}</span>
          </div>
          {occasionType === "wedding" ? (
            <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-amber-300 hover:text-amber-200">
              Edit details & video
            </button>
          ) : (
            <Link href="/pricing" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
              Edit package
            </Link>
          )}
        </div>

        <StepBar step={step} onStepChange={setStep} />

        <div className="glass-card p-8">
          {step === 0 && <StepOccasion selected={occasionType} onSelect={(o) => {
            setOccasionType(o);
            const defaultT = OCCASIONS.find(occ => occ.id === o)?.defaultTheme || "galaxy";
            setFormData(f => ({ ...f, theme: defaultT, relation: o === "wedding" ? "couple" : "" }));
          }} />}
          {step === 1 && <Step1 data={formData} onChange={setFormData} occasionType={occasionType} features={activeFeatures} />}
          {step === 2 && <Step2 photos={photos} onPhotos={setPhotos} features={activeFeatures} occasionType={occasionType} weddingData={formData.weddingData} onWeddingChange={(weddingData) => setFormData((current) => ({ ...current, weddingData }))} />}
          {step === 3 && <Step3 musicData={musicData} onChange={setMusicData} features={activeFeatures} occasionType={occasionType} weddingData={formData.weddingData} onWeddingChange={(weddingData) => setFormData((current) => ({ ...current, weddingData }))} />}
          {step === 4 && <Step4 data={{ ...formData, musicData }} photos={photos} occasionType={occasionType} features={activeFeatures} priceInr={priceInr} pricing={pricing} onEditWeddingDetails={() => setStep(1)} />}
          {step === 5 && celebrationId && (
            <Step5
              celebrationId={celebrationId}
              onSuccess={(slug) => {
                localStorage.removeItem(createDraftStorageKey(user.uid));
                trackEvent("purchase_completed", { slug, occasionType });
                router.push(`/dashboard/success?slug=${slug}`);
              }}
              occasionType={occasionType}
              priceInr={priceInr}
            />
          )}

          {step < 5 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-purple-500/10">
              {step > 0 ? (
                <button onClick={() => setStep((s) => s - 1)} className="btn-ghost py-2 px-6">
                  <ArrowLeft size={16} /> Back
                </button>
              ) : <div />}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                {lastSavedAt && (
                  <span className="text-xs text-white/45">
                    Auto-saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <button type="button" onClick={saveDraftNow} className="btn-ghost py-2 px-4">
                  <Save size={15} /> Save draft
                </button>
                <button
                  id="next-step"
                  onClick={saveAndProceed}
                  disabled={!canProceed || saving}
                  className="btn-primary py-2 px-8 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : step === 4 ? "Proceed to Payment" : "Continue"}
                  {!saving && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
