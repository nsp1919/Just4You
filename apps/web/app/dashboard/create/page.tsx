"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, THEMES, PRESET_TRACKS, MAX_PHOTOS, MAX_MESSAGE_LENGTH, OCCASIONS, RELATION_BY_OCCASION } from "@/lib/constants";
import type { Theme, OccasionType } from "@/lib/constants";
import { Upload, Music, CreditCard, ArrowLeft, ArrowRight, X, Check, Mic, Square, Play, Pause } from "lucide-react";
import Link from "next/link";

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Occasion", "Details", "Photos", "Music", "Preview", "Pay"];
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${i < step ? "bg-green-500/20 text-green-400 border border-green-500/30" :
              i === step ? "border text-white" : "text-[var(--text-muted)] border border-transparent"
            }`}
            style={i === step ? { background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.5)" } : {}}>
            {i < step ? <Check size={11} /> : <span className="w-4 text-center">{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-4 h-px" style={{ background: i < step ? "#22c55e" : "rgba(255,255,255,0.1)" }} />
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
function Step1({ data, onChange, occasionType }: { data: any; onChange: (d: any) => void; occasionType: OccasionType }) {
  const occasion = OCCASIONS.find((o) => o.id === occasionType) ?? OCCASIONS[0];
  const relations = RELATION_BY_OCCASION[occasionType] ?? RELATION_BY_OCCASION.birthday;

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
        <label className="block text-sm font-medium mb-2">
          Your Personal Message *
          <span className="ml-2 text-xs text-[var(--text-muted)]">{data.message.length}/{MAX_MESSAGE_LENGTH}</span>
        </label>
        <textarea
          id="birthday-message"
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value.slice(0, MAX_MESSAGE_LENGTH) })}
          placeholder={occasion.messagePlaceholder}
          rows={5}
          className="input-field resize-none leading-relaxed"
        />
      </div>

      {/* ── Countdown toggle ── */}
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
    </div>
  );
}

// ─── Step 2: Photos ───────────────────────────────────────────────────────────
function Step2({ photos, onPhotos }: { photos: string[]; onPhotos: (p: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number[]>([]);

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
    const remaining = MAX_PHOTOS - photos.length;
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
        Upload up to <strong className="text-white">{MAX_PHOTOS} photos</strong>. They'll appear in a beautiful animated slideshow.
        <span className="ml-2 font-semibold" style={{ color: photos.length >= MAX_PHOTOS ? "#22c55e" : "#a855f7" }}>
          {photos.length}/{MAX_PHOTOS} uploaded
        </span>
      </div>

      {photos.length < MAX_PHOTOS && (
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
            multiple
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
              <div className="font-semibold text-sm">Drag & drop photos here</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">or click to browse — JPG, PNG, WEBP accepted</div>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                <button
                  onClick={() => removePhoto(i)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center transition-all duration-200"
                >
                  <X size={14} color="white" />
                </button>
              </div>
              <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-xs">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Music + Voice ────────────────────────────────────────────────────
function Step3({ musicData, onChange }: { musicData: any; onChange: (d: any) => void }) {
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

  return (
    <div className="space-y-6 step-enter">
      {/* Music tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "none", label: "🔇 No Music" },
          { id: "preset", label: "🎵 Preset" },
          { id: "upload", label: "📤 Upload Song" },
          { id: "voice", label: "🎤 Voice Message" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`music-${tab.id}`}
            onClick={() => onChange({ ...musicData, musicType: tab.id })}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all min-w-fit ${musicData.musicType === tab.id ? "border text-white" : "glass text-[var(--text-muted)]"
              }`}
            style={musicData.musicType === tab.id ? { background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.5)" } : {}}
          >
            {tab.label}
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
    </div>
  );
}

// ─── Step 4: Preview ──────────────────────────────────────────────────────────
function Step4({ data, photos, occasionType }: { data: any; photos: string[]; occasionType: OccasionType }) {
  const theme = THEMES.find((t) => t.id === data.theme) ?? THEMES[0];
  const track = PRESET_TRACKS.find((t) => t.id === data.musicData?.musicPresetId);
  const occasion = OCCASIONS.find((o) => o.id === occasionType) ?? OCCASIONS[0];

  return (
    <div className="space-y-6 step-enter">
      <div className="text-sm text-[var(--text-muted)]">Here's a preview of your {occasion.label} website:</div>
      <div className={`rounded-3xl overflow-hidden p-8 text-center relative min-h-64 flex flex-col items-center justify-center gap-4`}
        style={{
          background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})`,
          color: theme.preview[2] || "#ffffff",
          boxShadow: `0 0 60px ${theme.preview[1]}40`,
        }}>
        <div className="text-5xl font-bold font-playfair" style={{ color: theme.preview[2] || "#ffffff" }}>
          {occasionType === "proposal" ? "Will You Marry Me? 💍" : occasionType === "anniversary" ? `Happy Anniversary, ${data.recipientName || "..."}! 💍` : `Happy Birthday, ${data.recipientName || "..."}! 🎂`}
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
          { label: "Photos", value: `${photos.length}/${MAX_PHOTOS}` },
          {
            label: "Music", value:
              data.musicData?.musicType === "preset" ? (track?.label ?? "Selected") :
                data.musicData?.musicType === "upload" ? "Custom song" :
                  data.musicData?.musicType === "voice" ? "Voice Message 🎤" : // BUG-12 fix
                    "No music"
          },
        ].map((item) => (
          <div key={item.label} className="glass-card p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
            <div className="font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 5: Payment ─────────────────────────────────────────────────────────
function Step5({ celebrationId, onSuccess, occasionType }: { celebrationId: string; onSuccess: (slug: string) => void; occasionType: OccasionType }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const occasion = OCCASIONS.find((o) => o.id === occasionType) ?? OCCASIONS[0];

  const isRedirectMode = !!process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

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
    const paymentUrl = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL;
    if (paymentUrl) {
      setLoading(true);
      setError("");
      try {
        localStorage.setItem("pending_celebration_id", celebrationId);
        
        // Construct external payment URL with notes and prefill fields
        const urlObj = new URL(paymentUrl);
        urlObj.searchParams.set("notes[celebrationId]", celebrationId);
        if (user?.email) {
          urlObj.searchParams.set("prefill[email]", user.email);
        }
        if (user?.displayName) {
          urlObj.searchParams.set("prefill[name]", user.displayName);
        }
        
        window.location.href = urlObj.toString();
      } catch (err: any) {
        console.error("Redirect error:", err);
        setError("Failed to redirect to the payment gateway. Please try again.");
        setLoading(false);
      }
      return;
    }

    if (!scriptReady) {
      setError("Payment gateway is still loading. Please wait a moment and try again.");
      return;
    }
    setLoading(true);
    setError("");
    // BUG-14: track when payment verification has started so ondismiss doesn't
    // reset loading after the handler fires (avoiding a double-submit window).
    const paymentDone = { current: false };
    try {
      const token = await user!.getIdToken();

      // Create Razorpay order
      const orderRes = await fetch("/api/payment/create-order", {
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

      const { orderId, amount, currency, keyId } = await orderRes.json();

      // Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Just4You",
        description: `${occasion.label} Website — ₹299`,
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
        <p className="text-[var(--text-muted)] text-sm mb-6">Pay once to activate your {occasion.label.toLowerCase()} website forever.</p>
        <div className="text-5xl font-bold gradient-text mb-2">₹299</div>
        <div className="text-xs text-[var(--text-muted)] mb-8">One-time payment • 1 year validity • Instant delivery</div>
        {error && (
          <div className="text-sm text-red-400 p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}
        <button
          id="pay-button"
          onClick={handlePay}
          disabled={loading || (!isRedirectMode && !scriptReady)}
          className="btn-primary w-full justify-center py-4 text-base glow-purple disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CreditCard size={20} />
          {!isRedirectMode && !scriptReady ? "Loading payment..." : loading ? "Opening payment..." : "Pay ₹299 & Go Live!"}
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
  const { user } = useAuth();
  const router = useRouter();
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
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [musicData, setMusicData] = useState({ musicType: "preset", musicPresetId: "t1", musicUploadUrl: "", voiceMessageUrl: "" });
  const [saving, setSaving] = useState(false);

  const canProceed = (() => {
    if (step === 0) return !!occasionType;
    if (step === 1) {
      const basic = formData.recipientName.trim() && formData.birthdayDate && formData.message.trim() && formData.theme && formData.relation;
      if (!basic) return false;
      if (formData.relation === "custom") {
        return !!formData.relationCustom?.trim();
      }
      return true;
    }
    if (step === 2) return photos.length > 0;
    // BUG-06: each music type requires its own condition — the old ternary incorrectly
    // allowed proceeding with no voice message when musicType was "voice".
    if (step === 3) {
      if (musicData.musicType === "none") return true;
      if (musicData.musicType === "preset") return !!musicData.musicPresetId;
      if (musicData.musicType === "upload") return !!musicData.musicUploadUrl;
      if (musicData.musicType === "voice") return !!musicData.voiceMessageUrl;
      return false;
    }
    return true;
  })();

  const saveAndProceed = async () => {
    if (step === 4) {
      // Save celebration to Firestore before payment
      setSaving(true);
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.CELEBRATIONS), {
          userId: user!.uid,
          recipientName: formData.recipientName,
          birthdayDate: formData.birthdayDate, // deprecated backward compatibility
          eventDate: formData.birthdayDate, // dynamic eventDate field
          message: formData.message,
          theme: formData.theme,
          relation: formData.relation,
          relationCustom: formData.relation === "custom" ? formData.relationCustom : "",
          occasionType,
          photos,
          countdownEnabled: formData.countdownEnabled ?? false,
          // Spread music fields (musicType, musicPresetId, musicUploadUrl)
          ...(musicData.musicType !== "voice" ? musicData : { musicType: "none" }),
          // Voice message URL (separate from background music)
          voiceMessageUrl: musicData.musicType === "voice" ? (musicData.voiceMessageUrl ?? "") : "",
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
        setStep(5);
      } catch (err) {
        console.error("Firestore save error:", err);
        alert("Failed to save celebration. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  if (step === 6) {
    // Success — handled by onSuccess callback
    return null;
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
          <h1 className="text-2xl font-bold font-playfair gradient-text">Create {currentOccasion.label} Website</h1>
          <p className="text-sm text-[var(--text-muted)]">Customize your interactive website</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <StepBar step={step} />

        <div className="glass-card p-8">
          {step === 0 && <StepOccasion selected={occasionType} onSelect={(o) => {
            setOccasionType(o);
            const defaultT = OCCASIONS.find(occ => occ.id === o)?.defaultTheme || "galaxy";
            setFormData(f => ({ ...f, theme: defaultT, relation: "" }));
          }} />}
          {step === 1 && <Step1 data={formData} onChange={setFormData} occasionType={occasionType} />}
          {step === 2 && <Step2 photos={photos} onPhotos={setPhotos} />}
          {step === 3 && <Step3 musicData={musicData} onChange={setMusicData} />}
          {step === 4 && <Step4 data={{ ...formData, musicData }} photos={photos} occasionType={occasionType} />}
          {step === 5 && celebrationId && (
            <Step5
              celebrationId={celebrationId}
              onSuccess={(slug) => router.push(`/dashboard/success?slug=${slug}`)}
              occasionType={occasionType}
            />
          )}

          {step < 5 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-purple-500/10">
              {step > 0 ? (
                <button onClick={() => setStep((s) => s - 1)} className="btn-ghost py-2 px-6">
                  <ArrowLeft size={16} /> Back
                </button>
              ) : <div />}
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
          )}
        </div>
      </div>
    </main>
  );
}
