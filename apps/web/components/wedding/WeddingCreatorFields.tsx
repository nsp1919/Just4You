"use client";

import { Check, ImagePlus, Music, Upload, X } from "lucide-react";
import { useState } from "react";
import {
  DEFAULT_WEDDING_CEREMONIES,
  MAX_WEDDING_CEREMONIES,
  WEDDING_ADDITIONAL_CEREMONY_PRICE_INR,
  WEDDING_BASE_PRICE_INR,
  WEDDING_CUSTOM_REVEAL_MUSIC_PRICE_INR,
  WEDDING_RSVP_PRICE_INR,
  type WeddingCeremonyDraft,
  type WeddingDataDraft,
} from "@/lib/constants";

interface WeddingDataProps {
  value: WeddingDataDraft;
  onChange: (value: WeddingDataDraft) => void;
}

export function createDefaultWeddingData(): WeddingDataDraft {
  return {
    partnerOne: "",
    partnerTwo: "",
    families: "",
    location: "",
    hashtag: "",
    directionsUrl: "",
    whatsappNumber: "",
    rsvpEnabled: true,
    rsvpDeadline: "",
    ceremonies: DEFAULT_WEDDING_CEREMONIES.map((ceremony) => ({ ...ceremony })),
  };
}

function updateCeremony(
  ceremonies: WeddingCeremonyDraft[],
  id: string,
  patch: Partial<WeddingCeremonyDraft>,
): WeddingCeremonyDraft[] {
  return ceremonies.map((ceremony) => ceremony.id === id ? { ...ceremony, ...patch } : ceremony);
}

export function WeddingDetailsEditor({
  value,
  onChange,
  weddingDate,
  onWeddingDateChange,
  message,
  onMessageChange,
}: WeddingDataProps & {
  weddingDate: string;
  onWeddingDateChange: (date: string) => void;
  message: string;
  onMessageChange: (message: string) => void;
}) {
  const setField = <Key extends keyof WeddingDataDraft>(field: Key, nextValue: WeddingDataDraft[Key]) => {
    onChange({ ...value, [field]: nextValue });
  };

  const selectedCount = value.ceremonies.filter((ceremony) => ceremony.selected).length;
  const includedCeremonyId = value.ceremonies.find((ceremony) => ceremony.selected)?.id;

  return (
    <div className="space-y-7 step-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">The couple</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Partner one *
            <input className="input-field mt-2" value={value.partnerOne} onChange={(event) => setField("partnerOne", event.target.value)} placeholder="e.g. Aarohi" maxLength={40} />
          </label>
          <label className="text-sm font-medium">
            Partner two *
            <input className="input-field mt-2" value={value.partnerTwo} onChange={(event) => setField("partnerTwo", event.target.value)} placeholder="e.g. Vihaan" maxLength={40} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Family names *
          <input className="input-field mt-2" value={value.families} onChange={(event) => setField("families", event.target.value)} placeholder="The Mehtas & The Reddys" maxLength={90} />
        </label>
        <label className="text-sm font-medium">
          Wedding date *
          <input className="input-field mt-2" type="date" value={weddingDate} onChange={(event) => onWeddingDateChange(event.target.value)} />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium">
          Main venue and city *
          <input className="input-field mt-2" value={value.location} onChange={(event) => setField("location", event.target.value)} placeholder="Taj Falaknuma Palace, Hyderabad" maxLength={120} />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium">
          Wedding hashtag
          <input className="input-field mt-2" value={value.hashtag} onChange={(event) => setField("hashtag", event.target.value.replace(/\s/g, "").toUpperCase())} placeholder="#AAROHIMEETSVIHAAN" maxLength={50} />
        </label>
      </div>

      <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.05] p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={value.rsvpEnabled} onChange={(event) => setField("rsvpEnabled", event.target.checked)} className="mt-1 h-4 w-4" style={{ accentColor: "#22c55e" }} />
          <span>
            <strong className="block text-sm">Add WhatsApp RSVP · ₹49</strong>
            <small className="mt-1 block text-[var(--text-muted)]">Guests can confirm attendance, ceremonies and guest count through WhatsApp.</small>
          </span>
        </label>
        {value.rsvpEnabled && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              RSVP WhatsApp number *
              <input className="input-field mt-2" value={value.whatsappNumber} onChange={(event) => setField("whatsappNumber", event.target.value.replace(/\D/g, "").slice(0, 15))} placeholder="919999999999" inputMode="tel" />
            </label>
            <label className="block text-sm font-medium">
              RSVP deadline
              <input className="input-field mt-2" type="date" value={value.rsvpDeadline} onChange={(event) => setField("rsvpDeadline", event.target.value)} max={weddingDate || undefined} />
            </label>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">
          Google Maps directions link
          <input className="input-field mt-2" type="url" value={value.directionsUrl} onChange={(event) => setField("directionsUrl", event.target.value)} placeholder="https://maps.google.com/..." />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium">
          Invitation message *
          <textarea className="input-field mt-2 resize-none leading-relaxed" rows={4} value={message} onChange={(event) => onMessageChange(event.target.value.slice(0, 500))} placeholder="Together with our families, we invite you to celebrate with us..." />
        </label>
      </div>

      <div>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3">
            <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-emerald-300">First festival</span>
            <strong className="mt-1 block text-lg text-white">Included</strong>
            <small className="text-white/45">in ₹{WEDDING_BASE_PRICE_INR} base</small>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] p-3">
            <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-amber-200">Each extra festival</span>
            <strong className="mt-1 block text-xl text-amber-300">+₹{WEDDING_ADDITIONAL_CEREMONY_PRICE_INR}</strong>
          </div>
          <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/[0.07] p-3">
            <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-fuchsia-200">Custom music</span>
            <strong className="mt-1 block text-xl text-fuchsia-300">+₹{WEDDING_CUSTOM_REVEAL_MUSIC_PRICE_INR}</strong>
            <small className="text-white/45">per festival</small>
          </div>
          <div className="rounded-xl border border-green-400/25 bg-green-400/[0.07] p-3">
            <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-green-200">WhatsApp RSVP</span>
            <strong className="mt-1 block text-xl text-green-300">+₹{WEDDING_RSVP_PRICE_INR}</strong>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Choose wedding celebrations *</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">The first ceremony is included. Every ceremony after it adds ₹49.</p>
          </div>
          <span className="text-xs font-semibold text-amber-300">{selectedCount} selected</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.ceremonies.map((ceremony) => {
            const isIncluded = ceremony.selected && ceremony.id === includedCeremonyId;
            return (
              <button
                key={ceremony.id}
                type="button"
                onClick={() => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { selected: !ceremony.selected }))}
                disabled={!ceremony.selected && selectedCount >= MAX_WEDDING_CEREMONIES}
                className={`relative min-h-24 rounded-xl border px-3 pb-3 pt-8 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${ceremony.selected ? "border-amber-400/60 bg-amber-400/10 text-white" : "border-white/10 bg-white/[0.03] text-white/55"}`}
              >
                <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold ${isIncluded ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>
                  {isIncluded ? "Included" : `+₹${WEDDING_ADDITIONAL_CEREMONY_PRICE_INR}`}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {ceremony.selected && <Check size={13} className="text-amber-300" />}
                  {ceremony.name}
                </span>
                <span className="mt-1 block text-[0.68rem] leading-snug">{ceremony.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {value.ceremonies.filter((ceremony) => ceremony.selected).map((ceremony) => (
          <div key={ceremony.id} className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
            <div className="mb-4 flex items-center justify-between">
              <strong className="font-playfair text-lg text-amber-100">{ceremony.name}</strong>
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-300">Event details</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-white/70">Display name<input className="input-field mt-1.5 text-sm" value={ceremony.name} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { name: event.target.value }))} /></label>
              <label className="text-xs font-medium text-white/70">Subtitle<input className="input-field mt-1.5 text-sm" value={ceremony.subtitle} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { subtitle: event.target.value }))} /></label>
              <label className="text-xs font-medium text-white/70">Date *<input className="input-field mt-1.5 text-sm" type="date" value={ceremony.date} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { date: event.target.value }))} /></label>
              <label className="text-xs font-medium text-white/70">Time *<input className="input-field mt-1.5 text-sm" type="time" value={ceremony.time} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { time: event.target.value }))} /></label>
              <label className="text-xs font-medium text-white/70 sm:col-span-2">Venue *<input className="input-field mt-1.5 text-sm" value={ceremony.venue} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { venue: event.target.value }))} placeholder="Venue name and area" /></label>
              <label className="text-xs font-medium text-white/70">Dress code<input className="input-field mt-1.5 text-sm" value={ceremony.dressCode} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { dressCode: event.target.value }))} /></label>
              <label className="text-xs font-medium text-white/70">Short note<input className="input-field mt-1.5 text-sm" value={ceremony.note} onChange={(event) => setField("ceremonies", updateCeremony(value.ceremonies, ceremony.id, { note: event.target.value }))} /></label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function uploadCloudinary(file: File, resource: "image" | "video", folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  formData.append("folder", folder);
  if (resource === "video") formData.append("resource_type", "video");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resource}/upload`,
    { method: "POST", body: formData },
  );
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  const result = await response.json();
  if (!result.secure_url) throw new Error(result.error?.message ?? "No upload URL returned.");
  return result.secure_url as string;
}

export function WeddingPosterEditor({ value, onChange }: WeddingDataProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = value.ceremonies.filter((ceremony) => ceremony.selected);

  const uploadPoster = async (ceremony: WeddingCeremonyDraft, file: File) => {
    setUploadingId(ceremony.id);
    setError(null);
    try {
      const image = await uploadCloudinary(file, "image", "birthdayglow/wedding/posters");
      onChange({ ...value, ceremonies: updateCeremony(value.ceremonies, ceremony.id, { image }) });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Poster upload failed.");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-7">
      <h3 className="font-playfair text-xl font-bold">Festival poster images</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Each selected celebration needs one portrait image for its interactive reveal.</p>
      {error && <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {selected.map((ceremony) => (
          <div key={ceremony.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="relative aspect-[4/3] bg-black/25">
              {ceremony.image ? (
                <>
                  <img src={ceremony.image} alt={`${ceremony.name} poster`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => onChange({ ...value, ceremonies: updateCeremony(value.ceremonies, ceremony.id, { image: "" }) })} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white" aria-label={`Remove ${ceremony.name} poster`}><X size={14} /></button>
                </>
              ) : (
                <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                  <input className="sr-only" type="file" accept="image/*" disabled={uploadingId !== null} onChange={(event) => event.target.files?.[0] && void uploadPoster(ceremony, event.target.files[0])} />
                  {uploadingId === ceremony.id ? <Upload className="animate-pulse text-amber-300" /> : <ImagePlus className="text-amber-300" />}
                  <span className="text-sm font-semibold">{uploadingId === ceremony.id ? "Uploading..." : `Upload ${ceremony.name} poster`}</span>
                  <small className="text-white/45">JPG, PNG or WEBP</small>
                </label>
              )}
            </div>
            <p className="px-4 py-3 text-sm font-semibold">{ceremony.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeddingRevealMusicEditor({ value, onChange }: WeddingDataProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = value.ceremonies.filter((ceremony) => ceremony.selected);

  const uploadMusic = async (ceremony: WeddingCeremonyDraft, file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose an audio file under 20MB.");
      return;
    }
    setUploadingId(ceremony.id);
    setError(null);
    try {
      const revealMusicUrl = await uploadCloudinary(file, "video", "birthdayglow/wedding/reveal-music");
      onChange({ ...value, ceremonies: updateCeremony(value.ceremonies, ceremony.id, { revealMusicUrl }) });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Music upload failed.");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
      <div className="flex items-center gap-3">
        <Music className="text-amber-300" size={22} />
        <div>
          <h3 className="font-semibold">Music for each festival reveal</h3>
          <p className="text-xs text-[var(--text-muted)]">Optional · ₹29 each. The selected track starts when that poster opens. Without one, default music is used.</p>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-4 space-y-3">
        {selected.map((ceremony) => (
          <div key={ceremony.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-3 sm:flex-row sm:items-center">
            <div className="min-w-32">
              <strong className="block text-sm">{ceremony.name}</strong>
              <span className="mt-1 inline-block rounded-full bg-fuchsia-400/15 px-2 py-0.5 text-[0.62rem] font-extrabold text-fuchsia-300">
                +₹{WEDDING_CUSTOM_REVEAL_MUSIC_PRICE_INR} custom music
              </span>
            </div>
            {ceremony.revealMusicUrl ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <audio className="h-9 min-w-0 flex-1" controls preload="metadata" src={ceremony.revealMusicUrl} />
                <button type="button" onClick={() => onChange({ ...value, ceremonies: updateCeremony(value.ceremonies, ceremony.id, { revealMusicUrl: "" }) })} className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-red-500/15 text-red-300" aria-label={`Remove ${ceremony.name} music`}><X size={14} /></button>
              </div>
            ) : (
              <label className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-amber-400/30 px-3 text-xs font-semibold text-amber-200">
                <input className="sr-only" type="file" accept="audio/*" disabled={uploadingId !== null} onChange={(event) => event.target.files?.[0] && void uploadMusic(ceremony, event.target.files[0])} />
                <Upload size={14} /> {uploadingId === ceremony.id ? "Uploading..." : "Upload individual track"}
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}