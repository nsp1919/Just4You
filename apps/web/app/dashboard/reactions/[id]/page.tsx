"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, ExternalLink, Gift, Instagram, Loader2, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatInr } from "@/lib/constants";

interface RewardClaim {
  instagramHandle: string;
  instagramPostUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  submittedAt: string | null;
}

interface ReactionData {
  recipientName: string;
  rewardInr: number;
  instagramUrl: string;
  claim: RewardClaim | null;
}

export default function ReactionRewardsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReactionData | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [confirmedSent, setConfirmedSent] = useState(false);
  const [consentToFeature, setConsentToFeature] = useState(false);
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
        const response = await fetch(`/api/social-reward-claims/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load reactions.");
        const next = result as ReactionData;
        setData(next);
        setInstagramHandle(next.claim?.instagramHandle ?? "");
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

  const submitClaim = async () => {
    if (!user) return;
    setWorking("claim");
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/social-reward-claims/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ instagramHandle, confirmedSent, consentToFeature }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to submit your reward claim.");
      setData((current) => current ? {
        ...current,
        claim: { instagramHandle: instagramHandle.replace(/^@/, ""), instagramPostUrl: "", status: "pending", rejectionReason: "", submittedAt: new Date().toISOString() },
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
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-pink-300">Instagram reaction reward</p>
          <h1 className="font-playfair text-3xl font-bold sm:text-4xl">Send {data.recipientName}&apos;s reaction and earn {formatInr(data.rewardInr)}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/50">Send the reaction video to the official Just4You Instagram page. Admin reviews it there, publishes or verifies the Reel, adds the public post link, and only then releases withdrawable wallet earnings.</p>
        </header>

        {error && <p role="alert" className="mb-6 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}

        {data.claim && data.claim.status !== "rejected" ? (
          <section className={`rounded-lg border p-6 ${data.claim.status === "approved" ? "border-emerald-400/25 bg-emerald-400/[0.08]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
            <div className="flex items-center gap-3">
              {data.claim.status === "approved" ? <CheckCircle size={24} className="text-emerald-300" /> : <Loader2 size={24} className="text-amber-200" />}
              <div><h2 className="font-playfair text-2xl font-semibold">{data.claim.status === "approved" ? `${formatInr(data.rewardInr)} added to your wallet` : "Instagram reaction under review"}</h2><p className="mt-1 text-sm text-white/45">Submitted from @{data.claim.instagramHandle}</p></div>
            </div>
            <p className="mt-5 max-w-2xl leading-7 text-white/55">{data.claim.status === "approved" ? "This verified earning is available at checkout and counts toward your Admin-set bank withdrawal minimum." : "Admin will check the reaction in Instagram. No wallet amount is credited until a public Instagram post URL is attached and approved."}</p>
            {data.claim.instagramPostUrl && <a href={data.claim.instagramPostUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-[#ffb877]"><ExternalLink size={15} /> View verified Instagram post</a>}
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["01", "Send the video", "Open the official Instagram page and send the reaction video by direct message."],
                ["02", "Submit your username", "Tell us which Instagram account sent the video and consent to featuring it."],
                ["03", "Admin verifies and pays", `Admin checks the DM, adds the published Instagram link, and approves ${formatInr(data.rewardInr)} to your withdrawable wallet.`],
              ].map(([number, title, description]) => (
                <div key={number} className="bg-[#17101e] p-6"><span className="text-xs font-bold text-pink-300">{number}</span><h2 className="mt-2 font-playfair text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{description}</p></div>
              ))}
            </section>

            <aside className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-5 font-bold text-white"><Instagram size={18} /> Open Just4You Instagram</a>
              <p className="mt-3 text-xs leading-5 text-white/35">In your DM, include the recipient name “{data.recipientName}” so Admin can match the video to this reward request.</p>

              <div className="mt-6 border-t border-white/10 pt-6">
                {data.claim?.status === "rejected" && <p className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] p-3 text-xs text-rose-200">Previous request was rejected: {data.claim.rejectionReason || "The Instagram reaction could not be verified."} You may send the video and submit again.</p>}
                <label className="block text-sm font-semibold text-white/65">Instagram username<input value={instagramHandle} onChange={(event) => setInstagramHandle(event.target.value.slice(0, 31))} placeholder="@yourusername" className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-3 font-normal text-white outline-none focus:border-pink-300" /></label>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/55"><input type="checkbox" checked={confirmedSent} onChange={(event) => setConfirmedSent(event.target.checked)} className="mt-1 h-4 w-4 accent-pink-400" /><span>I sent the reaction video to the official Instagram page and included the recipient name.</span></label>
                <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/55"><input type="checkbox" checked={consentToFeature} onChange={(event) => setConsentToFeature(event.target.checked)} className="mt-1 h-4 w-4 accent-pink-400" /><span>I have permission from the person in the video and consent to Just4You featuring the reaction on Instagram.</span></label>
                <button type="button" onClick={submitClaim} disabled={!instagramHandle.trim() || !confirmedSent || !consentToFeature || working === "claim"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 font-bold text-[#07120d] disabled:cursor-not-allowed disabled:opacity-40">{working === "claim" ? <Loader2 className="animate-spin" size={17} /> : <Gift size={17} />} Request {formatInr(data.rewardInr)} reward</button>
                <p className="mt-3 text-xs leading-5 text-white/30">One reward per celebration. No video is uploaded to Just4You or Cloudinary.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}