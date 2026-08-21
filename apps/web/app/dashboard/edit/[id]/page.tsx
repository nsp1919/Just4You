"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, CheckCircle, ExternalLink, Heart, Save, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";

function normalizedVideoUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 2048) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function EditWeddingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projectName, setProjectName] = useState("Wedding invitation");
  const [partnerOne, setPartnerOne] = useState("");
  const [partnerTwo, setPartnerTwo] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push(`/login?next=${encodeURIComponent(`/dashboard/edit/${id}`)}`);
  }, [user, authLoading, router, id]);

  useEffect(() => {
    if (!user || !id) return;

    const loadProject = async () => {
      try {
        const snapshot = await getDoc(doc(db, COLLECTIONS.CELEBRATIONS, id));
        const data = snapshot.data();
        if (
          !snapshot.exists()
          || data?.userId !== user.uid
          || data?.occasionType !== "wedding"
          || data?.paymentStatus !== "paid"
        ) {
          router.replace("/dashboard");
          return;
        }

        const partnerOne = data.weddingData?.couple?.partnerOne;
        const partnerTwo = data.weddingData?.couple?.partnerTwo;
        if (partnerOne && partnerTwo) {
          setPartnerOne(partnerOne);
          setPartnerTwo(partnerTwo);
          setProjectName(`${partnerOne} & ${partnerTwo}`);
        }
        setVideoUrl(data.weddingData?.videoUrl ?? "");
      } catch (loadError) {
        console.error("Failed to load wedding video settings:", loadError);
        setError("Unable to load this project. Please return to the dashboard and try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [user, id, router]);

  const saveWeddingDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !id) return;

    const normalizedPartnerOne = partnerOne.trim();
    const normalizedPartnerTwo = partnerTwo.trim();
    if (!normalizedPartnerOne || !normalizedPartnerTwo) {
      setStatus("error");
      setError("Enter both names before saving.");
      return;
    }

    const normalized = normalizedVideoUrl(videoUrl);
    if (normalized === null) {
      setStatus("error");
      setError("Enter a valid public HTTP or HTTPS video link.");
      return;
    }

    setSaving(true);
    setStatus("idle");
    setError("");
    try {
      await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, id), {
        "weddingData.couple.partnerOne": normalizedPartnerOne,
        "weddingData.couple.partnerTwo": normalizedPartnerTwo,
        "weddingData.couple.monogram": `${normalizedPartnerOne.charAt(0)} · ${normalizedPartnerTwo.charAt(0)}`.toUpperCase(),
        "weddingData.videoUrl": normalized,
        recipientName: `${normalizedPartnerOne} & ${normalizedPartnerTwo}`,
        updatedAt: serverTimestamp(),
      });
      setPartnerOne(normalizedPartnerOne);
      setPartnerTwo(normalizedPartnerTwo);
      setProjectName(`${normalizedPartnerOne} & ${normalizedPartnerTwo}`);
      setVideoUrl(normalized);
      setStatus("saved");
    } catch (saveError) {
      console.error("Failed to update wedding video link:", saveError);
      setStatus("error");
      setError("The video link could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-amber-300" aria-label="Loading project" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10" style={{ background: "var(--bg-deep)" }}>
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Paid wedding project</p>
          <h1 className="font-playfair text-3xl font-bold text-white sm:text-4xl">Edit wedding details</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{projectName}</p>
        </div>

        {error && status === "idle" ? (
          <div className="rounded-xl border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-200">{error}</div>
        ) : (
          <form onSubmit={saveWeddingDetails} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3 border-b border-white/10 pb-6">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-rose-400/10 text-rose-300"><Heart size={20} /></span>
              <div>
                <h2 className="font-semibold text-white">Bride and groom names</h2>
                <p className="mt-1 text-sm leading-6 text-white/50">These names appear throughout the live invitation, including its title and RSVP page.</p>
              </div>
            </div>

            <div className="mb-7 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-white/80">
                Bride name
                <input
                  className="input-field mt-2"
                  value={partnerOne}
                  onChange={(event) => {
                    setPartnerOne(event.target.value);
                    setStatus("idle");
                    setError("");
                  }}
                  placeholder="Bride name"
                  maxLength={80}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-white/80">
                Groom name
                <input
                  className="input-field mt-2"
                  value={partnerTwo}
                  onChange={(event) => {
                    setPartnerTwo(event.target.value);
                    setStatus("idle");
                    setError("");
                  }}
                  placeholder="Groom name"
                  maxLength={80}
                  required
                />
              </label>
            </div>

            <div className="mb-6 flex items-start gap-3 border-b border-white/10 pb-6">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Video size={20} /></span>
              <div>
                <h2 className="font-semibold text-white">Wedding invitation video link</h2>
                <p className="mt-1 text-sm leading-6 text-white/50">Paste an unlisted YouTube, Vimeo, public Google Drive, or direct video link. No video file is stored by BirthdayGlow.</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-white/80">
              Public video URL
              <input
                className="input-field mt-2"
                type="url"
                value={videoUrl}
                onChange={(event) => {
                  setVideoUrl(event.target.value);
                  setStatus("idle");
                  setError("");
                }}
                placeholder="https://youtube.com/watch?v=..."
                maxLength={2048}
              />
            </label>

            <p className="mt-3 text-xs leading-5 text-white/40">Leave the field empty and save to remove the QR video section from the invitation.</p>

            {videoUrl && normalizedVideoUrl(videoUrl) !== null && (
              <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
                <ExternalLink size={15} /> Test this video link
              </a>
            )}

            {status === "saved" && <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-300" role="status"><CheckCircle size={16} /> Wedding details updated.</p>}
            {status === "error" && <p className="mt-5 text-sm text-red-300" role="alert">{error}</p>}

            <button type="submit" disabled={saving} className="btn-primary mt-6 min-h-11 w-full justify-center disabled:cursor-wait disabled:opacity-60">
              <Save size={17} /> {saving ? "Saving..." : "Save wedding details"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}