"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Check, Mic, Square, Upload, UsersRound } from "lucide-react";

interface InviteDetails {
  recipientName: string;
  occasionType: string;
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

async function uploadToCloudinary(file: File, resourceType: "image" | "video"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) throw new Error("Media uploads are not configured yet.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", "birthdayglow/contributions");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message ?? "Media upload failed.");
  }
  return result.secure_url as string;
}

export default function ContributionPage() {
  const { id, token } = useParams<{ id: string; token: string }>();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!id || !token) return;
    const controller = new AbortController();
    fetch(`/api/collaboration/${id}?token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "This invite is unavailable.");
        setInvite(result as InviteDetails);
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id, token]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVoice(new File([blob], "voice-message.webm", { type: mimeType }));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access was unavailable. You can upload an audio file instead.");
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || (!message.trim() && !photo && !voice)) {
      setError("Add your name and at least one message, photo, or voice note.");
      return;
    }
    if (photo && photo.size > MAX_PHOTO_BYTES) {
      setError("Please choose a photo smaller than 8 MB.");
      return;
    }
    if (voice && voice.size > MAX_AUDIO_BYTES) {
      setError("Please choose a voice note smaller than 15 MB.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const [photoUrl, voiceUrl] = await Promise.all([
        photo ? uploadToCloudinary(photo, "image") : Promise.resolve(""),
        voice ? uploadToCloudinary(voice, "video") : Promise.resolve(""),
      ]);
      const response = await fetch(`/api/collaboration/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, relationship, message, photoUrl, voiceUrl, website }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to send your contribution.");
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send your contribution.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#130d19] text-white"><div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#ff9e4f]" /></main>;
  }

  if (!invite) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#130d19] px-5 text-center text-white">
        <div className="max-w-md">
          <div className="mb-5 text-5xl">🔒</div>
          <h1 className="font-playfair text-3xl font-bold">Invite unavailable</h1>
          <p className="mt-3 text-white/55">{error || "Ask the creator for a new collaboration link."}</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#130d19] px-5 text-center text-white">
        <div className="max-w-lg">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check size={38} /></div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Contribution sent</p>
          <h1 className="font-playfair text-4xl font-bold">You are part of the surprise.</h1>
          <p className="mt-4 leading-7 text-white/55">The creator will review your memory before it appears on {invite.recipientName}&apos;s page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#130d19] px-5 py-10 text-white sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-9 text-center">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#ff8a5c] to-[#ff5f93] shadow-[0_12px_35px_rgba(255,95,147,0.25)]"><UsersRound size={23} /></span>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb877]">A private group surprise</p>
          <h1 className="font-playfair text-4xl font-bold leading-tight sm:text-5xl">Add something special for {invite.recipientName}</h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-white/55">Share a memory, photo, or voice note. The creator will review it before the surprise goes live.</p>
        </header>

        <form onSubmit={submit} className="space-y-6 border-y border-white/10 py-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-white/70">Your name
              <input value={name} onChange={(event) => setName(event.target.value.slice(0, 50))} maxLength={50} required placeholder="e.g. Rahul" className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 font-normal text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff9e4f]" />
            </label>
            <label className="text-sm font-semibold text-white/70">How you know them
              <input value={relationship} onChange={(event) => setRelationship(event.target.value.slice(0, 40))} maxLength={40} placeholder="e.g. College friend" className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 font-normal text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff9e4f]" />
            </label>
          </div>

          <label className="block text-sm font-semibold text-white/70">Your message
            <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 500))} maxLength={500} rows={6} placeholder="Write a favourite memory or something you want them to hear..." className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 font-normal leading-7 text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#ff9e4f]" />
            <span className="mt-1 block text-right text-xs font-normal text-white/30">{message.length}/500</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] px-4 text-center transition-colors hover:border-[#ff9e4f]/60">
              <Camera size={22} className="mb-2 text-[#ffb877]" />
              <strong className="text-sm">{photo ? photo.name : "Add one photo"}</strong>
              <span className="mt-1 text-xs text-white/35">JPG, PNG or WebP · max 8 MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
            </label>

            <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] px-4 text-center">
              <Mic size={22} className="mb-2 text-[#ff7ca8]" />
              <strong className="text-sm">{voice ? voice.name : recording ? "Recording..." : "Add a voice note"}</strong>
              <div className="mt-2 flex items-center gap-3">
                <button type="button" onClick={recording ? stopRecording : startRecording} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff9e4f]">
                  {recording ? <><Square size={12} fill="currentColor" /> Stop</> : <><Mic size={12} /> Record</>}
                </button>
                <span className="text-white/20">or</span>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white">
                  <Upload size={12} /> Upload
                  <input type="file" accept="audio/*" className="sr-only" onChange={(event) => setVoice(event.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          </div>

          <label className="absolute -left-[10000px]" aria-hidden="true">Website
            <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
          </label>

          {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}

          <button type="submit" disabled={submitting || recording} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-6 font-bold text-white shadow-[0_14px_35px_rgba(255,95,147,0.2)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "Sending your contribution..." : "Add me to the surprise"}
          </button>
          <p className="text-center text-xs leading-5 text-white/30">Your contribution stays private until the creator approves it.</p>
        </form>
      </div>
    </main>
  );
}