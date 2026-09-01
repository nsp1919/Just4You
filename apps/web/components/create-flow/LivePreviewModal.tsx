"use client";

import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import GalaxyTheme from "@/components/themes/GalaxyTheme";
import FloralTheme from "@/components/themes/FloralTheme";
import NeonTheme from "@/components/themes/NeonTheme";
import MinimalTheme from "@/components/themes/MinimalTheme";
import RetroTheme from "@/components/themes/RetroTheme";
import MagicalTheme from "@/components/themes/MagicalTheme";
import WeddingInvitation, { type WeddingInvitationData } from "@/components/wedding/WeddingInvitation";
import type { OccasionType, WeddingDataDraft } from "@/lib/constants";
import { resolveBackgroundMusicType } from "@/lib/media-selection";
import { trackEvent } from "@/lib/analytics";

const PREVIEW_THEME_COMPONENTS: Record<string, ComponentType<any>> = {
  galaxy: GalaxyTheme,
  floral: FloralTheme,
  neon: NeonTheme,
  minimal: MinimalTheme,
  retro: RetroTheme,
  magical: MagicalTheme,
};

interface Props {
  data: any;
  photos: string[];
  musicData: any;
  occasionType: OccasionType;
  onClose: () => void;
}

export default function LivePreviewModal({ data, photos, musicData, occasionType, onClose }: Props) {
  const ThemeComp = PREVIEW_THEME_COMPONENTS[data.theme] ?? GalaxyTheme;
  const previewRef = useRef<HTMLDivElement>(null);
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  const previewCelebration = {
    id: "demo-preview",
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
    return () => { document.body.style.overflow = previousOverflow; };
  }, [data.theme, occasionType]);

  return createPortal(
    <div ref={previewRef} className="fixed inset-0 z-[300] overflow-y-auto bg-black" role="dialog" aria-modal="true" aria-label="Website live preview">
      <div className="fixed left-0 right-0 top-0 z-[310] flex items-center justify-between px-4 py-2.5 text-sm" style={{ background: "rgba(10,6,18,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <span className="flex items-center gap-2 font-semibold text-white">
          <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-bold" style={{ background: "linear-gradient(135deg,#ff8a5c,#ff5f93)" }}>LIVE PREVIEW</span>
          <span className="hidden text-white/60 sm:inline">This is exactly what they&apos;ll see</span>
        </span>
        <button type="button" onClick={onClose} className="flex min-h-11 items-center gap-1.5 font-medium text-white/80 hover:text-white"><X size={16} />Close</button>
      </div>
      <div className="pointer-events-none fixed inset-0 z-[305] flex items-center justify-center overflow-hidden" style={{ backdropFilter: "blur(5px)", background: "rgba(0,0,0,0.01)" }}>
        <div className="select-none whitespace-nowrap font-black text-white/[0.06]" style={{ fontSize: "6rem", transform: "rotate(-30deg)", letterSpacing: "0.1em" }}>JUST4YOU.BUZZ · PREVIEW · JUST4YOU.BUZZ</div>
      </div>
      <div className="select-none pt-11">{weddingInvitation ? <WeddingInvitation invitation={weddingInvitation} /> : <ThemeComp celebration={previewCelebration} />}</div>
    </div>,
    document.body,
  );
}
