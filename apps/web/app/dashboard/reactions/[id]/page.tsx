"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Download, ExternalLink, Gift, Instagram, Loader2, Share2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatInr } from "@/lib/constants";

type Platform = "instagram" | "whatsapp";

interface ReactionRecording {
  id: string;
  name: string;
  videoUrl: string;
  consentToShare: boolean;
  status: "available" | "hidden";
  createdAt: string | null;
}

interface RewardClaim {
  platform: Platform;
  status: "pending" | "approved" | "rejected";
  proofUrl: string;
  rejectionReason: string;
  submittedAt: string | null;
}

interface ReactionData {
  recipientName: string;
  recordings: ReactionRecording[];
  rewardInr: number;
  claim: RewardClaim | null;
}

function instagramVideoUrl(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return url;
  const transformed = url.replace("/video/upload/", "/video/upload/f_mp4,vc_h264,ac_aac/");
  return transformed.replace(/\.[a-z0-9]+(?:\?.*)?$/i, ".mp4");
}

async function uploadProofScreenshot(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) throw new Error("Screenshot uploads are not configured.");
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 8 MB.");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", "birthdayglow/social-proof");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
  const result = await response.json();
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message ?? "Screenshot upload failed.");
  return result.secure_url as string;
}

export default function ReactionRewardsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReactionData | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappProof, setWhatsappProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user || !id) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/reaction-recordings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load reactions.");
        const next = result as ReactionData;
        setData(next);
        setSelectedId(next.recordings.find((item) => item.status === "available")?.id ?? "");
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load reactions.");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [id, user]);

  const selected = data?.recordings.find((item) => item.id === selectedId) ?? null;

  const downloadOrShare = async () => {
    if (!selected) return;
    setWorking("share");
    setError("");
    try {
      const response = await fetch(instagramVideoUrl(selected.videoUrl));
      if (!response.ok) throw new Error("Unable to prepare the branded video.");
      const blob = await response.blob();
      const file = new File([blob], `just4you-reaction-${id}.mp4`, { type: "video/mp4" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Reaction to ${data?.recipientName}'s surprise`, text: "Made with Just4You.buzz" });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setError(shareError instanceof Error ? shareError.message : "Unable to share this video.");
    } finally {
      setWorking("");
    }
  };

  const submitClaim = async () => {
    if (!user || !selected) return;
    setWorking("claim");
    setError("");
    try {
      const proofUrl = platform === "instagram"
        ? instagramUrl.trim()
        : whatsappProof ? await uploadProofScreenshot(whatsappProof) : "";
      if (!proofUrl) throw new Error(platform === "instagram" ? "Paste your public Instagram Reel or post URL." : "Upload a screenshot of your WhatsApp Status.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/reaction-recordings/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recordingId: selected.id, platform, proofUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to submit your reward claim.");
      setData((current) => current ? {
        ...current,
        claim: { platform, proofUrl, status: "pending", rejectionReason: "", submittedAt: new Date().toISOString() },
      } : current);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Unable to submit your reward claim.");
    } finally {
      setWorking("");
    }
  };

  if (authLoading || loading) return <main className="grid min-h-screen place-items-center bg-[var(--bg-deep)] text-white"><Loader2 className="animate-spin text-[#ff9e4f]" size={34} /></main>;
  if (!data) return <main className="grid min-h-screen place-items-center bg-[var(--bg-deep)] px-5 text-center text-white"><div><h1 className="font-playfair text-3xl font-bold">Unable to load reactions</h1><p className="mt-3 text-white/55">{error}</p></div></main>;

  return (
    <main className="min-h-screen bg-[var(--bg-deep)] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft size={16} /> Back to dashboard</Link>
        <header className="mb-9 border-b border-white/10 pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Reaction rewards</p>
          <h1 className="font-playfair text-3xl font-bold sm:text-4xl">The moment {data.recipientName} saw it</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/50">Share a consented branded reaction on Instagram or WhatsApp Status. Submit proof for Admin review and earn {formatInr(data.rewardInr)} in withdrawable wallet earnings after approval.</p>
        </header>

        {error && <p role="alert" className="mb-6 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}

        {data.recordings.length === 0 ? (
          <section className="border-y border-white/10 py-16 text-center"><span className="text-4xl">🎥</span><h2 className="mt-4 font-playfair text-2xl font-semibold">No reaction yet</h2><p className="mt-2 text-sm text-white/45">The recipient will see the recording invitation at the bottom of the surprise.</p></section>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section>
              <h2 className="mb-4 font-playfair text-2xl font-semibold">Private reactions</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {data.recordings.map((recording) => (
                  <button key={recording.id} type="button" onClick={() => setSelectedId(recording.id)} className={`overflow-hidden rounded-lg border text-left transition-colors ${selectedId === recording.id ? "border-[#ff9e4f]" : "border-white/10 hover:border-white/25"}`}>
                    <video src={recording.videoUrl} controls playsInline preload="metadata" className="aspect-[9/16] max-h-[430px] w-full bg-black object-contain" onClick={(event) => event.stopPropagation()} />
                    <div className="flex items-center justify-between gap-3 p-4"><div><strong className="block">{recording.name}</strong><span className="mt-1 block text-xs text-white/35">{recording.createdAt ? new Date(recording.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recently"}</span></div>{selectedId === recording.id && <CheckCircle size={20} className="text-[#ff9e4f]" />}</div>
                  </button>
                ))}
              </div>
            </section>

            <aside className="border-t border-white/10 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <h2 className="font-playfair text-2xl font-semibold">Share and earn</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">The selected video already includes the Just4You.buzz watermark and ending frame.</p>
              <button type="button" onClick={downloadOrShare} disabled={!selected || working === "share"} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#18101e] disabled:opacity-40">
                {working === "share" ? <Loader2 className="animate-spin" size={16} /> : <Share2 size={16} />} Share or download video
              </button>
              <p className="mt-2 text-xs leading-5 text-white/30">On supported phones, choose Instagram or WhatsApp from the share sheet. Otherwise, download and upload it manually.</p>

              {data.claim && data.claim.status !== "rejected" ? (
                <div className={`mt-7 rounded-lg border p-4 ${data.claim.status === "approved" ? "border-emerald-400/25 bg-emerald-400/[0.08]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
                  <div className="flex items-center gap-2 font-bold">{data.claim.status === "approved" ? <CheckCircle size={17} className="text-emerald-300" /> : <Loader2 size={17} className="text-amber-200" />} {data.claim.status === "approved" ? `${formatInr(data.rewardInr)} credit added` : "Proof under review"}</div>
                  <p className="mt-2 text-xs leading-5 text-white/45">{data.claim.status === "approved" ? "The approved earning can be used at checkout or withdrawn after your cash balance reaches the Admin-set minimum." : "An Admin will verify the public post before adding wallet earnings."}</p>
                  <a href={data.claim.proofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#ffb877]"><ExternalLink size={12} /> View submitted proof</a>
                </div>
              ) : (
                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="mb-4 flex rounded-lg bg-white/[0.04] p-1">
                    <button type="button" onClick={() => setPlatform("instagram")} className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-bold ${platform === "instagram" ? "bg-[#ff5f93] text-white" : "text-white/45"}`}><Instagram size={14} /> Instagram</button>
                    <button type="button" onClick={() => setPlatform("whatsapp")} className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-bold ${platform === "whatsapp" ? "bg-[#25d366] text-[#071b0e]" : "text-white/45"}`}><Share2 size={14} /> WhatsApp</button>
                  </div>
                  {data.claim?.status === "rejected" && <p className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] p-3 text-xs text-rose-200">Previous proof was rejected: {data.claim.rejectionReason || "The post could not be verified."} You can submit new proof.</p>}
                  {platform === "instagram" ? (
                    <label className="block text-sm font-semibold text-white/65">Public Reel or post URL<input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-normal text-white outline-none focus:border-[#ff9e4f]" /></label>
                  ) : (
                    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 px-4 text-center hover:border-[#25d366]/60"><Upload size={18} className="mb-2 text-[#25d366]" /><strong className="text-sm">{whatsappProof ? whatsappProof.name : "Upload Status screenshot"}</strong><span className="mt-1 text-xs text-white/35">Image · max 8 MB</span><input type="file" accept="image/*" className="sr-only" onChange={(event) => setWhatsappProof(event.target.files?.[0] ?? null)} /></label>
                  )}
                  <button type="button" onClick={submitClaim} disabled={!selected || working === "claim"} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-4 text-sm font-bold disabled:opacity-40">{working === "claim" ? <Loader2 className="animate-spin" size={16} /> : <Gift size={16} />} Submit proof for {formatInr(data.rewardInr)}</button>
                  <p className="mt-3 text-xs leading-5 text-white/30">One reward per celebration. Payment becomes withdrawable only after Admin verifies the post.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}