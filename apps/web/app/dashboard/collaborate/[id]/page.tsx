"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, ExternalLink, Link2, Loader2, Mic, RefreshCw, Share2, UserRoundX, UsersRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type ContributionStatus = "pending" | "approved" | "rejected";

interface Contribution {
  id: string;
  name: string;
  relationship: string;
  message: string;
  photoUrl: string;
  voiceUrl: string;
  status: ContributionStatus;
  createdAt: string | null;
}

interface CollaborationData {
  recipientName: string;
  occasionType: string;
  inviteEnabled: boolean;
  inviteUrl: string | null;
  contributions: Contribution[];
}

export default function CollaborationDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<CollaborationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [copied, setCopied] = useState(false);
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
        const response = await fetch(`/api/collaboration/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load contributions.");
        setData(result as CollaborationData);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load contributions.");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [id, user]);

  const authenticatedRequest = async (method: "POST" | "PATCH", body: Record<string, unknown>) => {
    if (!user) throw new Error("Please sign in again.");
    const token = await user.getIdToken();
    const response = await fetch(`/api/collaboration/${id}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Unable to update collaboration settings.");
    return result;
  };

  const createInvite = async () => {
    setWorking("invite");
    setError("");
    try {
      const result = await authenticatedRequest("POST", {});
      setData((current) => current ? { ...current, inviteEnabled: true, inviteUrl: result.inviteUrl } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create the invite.");
    } finally {
      setWorking("");
    }
  };

  const toggleInvite = async () => {
    if (!data) return;
    setWorking("toggle");
    setError("");
    try {
      const result = await authenticatedRequest("PATCH", { inviteEnabled: !data.inviteEnabled });
      setData({ ...data, inviteEnabled: result.inviteEnabled });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update the invite.");
    } finally {
      setWorking("");
    }
  };

  const moderate = async (contributionId: string, status: ContributionStatus) => {
    setWorking(contributionId);
    setError("");
    try {
      await authenticatedRequest("PATCH", { contributionId, status });
      setData((current) => current ? {
        ...current,
        contributions: current.contributions.map((item) => item.id === contributionId ? { ...item, status } : item),
      } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to moderate this contribution.");
    } finally {
      setWorking("");
    }
  };

  const copyInvite = async () => {
    if (!data?.inviteUrl) return;
    await navigator.clipboard.writeText(data.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareInvite = () => {
    if (!data?.inviteUrl) return;
    const text = `Help me create a group surprise for ${data.recipientName}! Add a private message, photo, or voice note here:\n\n${data.inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  if (authLoading || loading) {
    return <main className="grid min-h-screen place-items-center bg-[var(--bg-deep)] text-white"><Loader2 className="animate-spin text-[#ff9e4f]" size={34} /></main>;
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg-deep)] px-5 text-center text-white">
        <div><h1 className="font-playfair text-3xl font-bold">Unable to open collaboration</h1><p className="mt-3 text-white/55">{error}</p><Link href="/dashboard" className="mt-6 inline-flex text-[#ffb877]">Return to dashboard</Link></div>
      </main>
    );
  }

  const pendingCount = data.contributions.filter((item) => item.status === "pending").length;
  const approvedCount = data.contributions.filter((item) => item.status === "approved").length;

  return (
    <main className="min-h-screen bg-[var(--bg-deep)] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"><ArrowLeft size={16} /> Back to dashboard</Link>

        <header className="mb-8 border-b border-white/10 pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb877]">Collaborative surprise</p>
          <h1 className="font-playfair text-3xl font-bold sm:text-4xl">Build {data.recipientName}&apos;s surprise together</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/50">Share one private link. Friends can add messages, photos, and voice notes without creating an account. Nothing appears publicly until you approve it.</p>
        </header>

        {error && <div role="alert" className="mb-6 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</div>}

        <section className="mb-10 grid gap-6 border-b border-white/10 pb-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="mb-3 flex items-center gap-2"><Link2 size={17} className="text-[#ff9e4f]" /><h2 className="font-semibold">Private contribution link</h2></div>
            {data.inviteUrl ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">{data.inviteUrl}</div>
                  <button type="button" onClick={copyInvite} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold hover:bg-white/[0.06]">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button>
                  <button type="button" onClick={shareInvite} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 text-sm font-bold text-[#071b0e] hover:brightness-105"><Share2 size={15} /> WhatsApp</button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={toggleInvite} disabled={!!working} className="text-sm font-semibold text-white/55 hover:text-white disabled:opacity-40">{data.inviteEnabled ? "Pause new contributions" : "Reopen contributions"}</button>
                  <span className="text-white/20">·</span>
                  <button type="button" onClick={createInvite} disabled={!!working} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb877] hover:text-[#ffd39d] disabled:opacity-40"><RefreshCw size={13} /> Replace link</button>
                  <a href={data.inviteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white"><ExternalLink size={13} /> Preview</a>
                </div>
              </>
            ) : (
              <button type="button" onClick={createInvite} disabled={working === "invite"} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-5 font-bold disabled:opacity-50">
                {working === "invite" ? <Loader2 className="animate-spin" size={16} /> : <UsersRound size={17} />} Start collecting memories
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            <div className="bg-[#17101e] p-4"><strong className="block text-2xl">{pendingCount}</strong><span className="text-xs text-white/40">Awaiting review</span></div>
            <div className="bg-[#17101e] p-4"><strong className="block text-2xl">{approvedCount}</strong><span className="text-xs text-white/40">Approved</span></div>
          </div>
        </section>

        <section aria-labelledby="contributions-heading">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-300">Review inbox</p><h2 id="contributions-heading" className="mt-1 font-playfair text-2xl font-bold">Group contributions</h2></div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.inviteEnabled ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.06] text-white/40"}`}>{data.inviteEnabled ? "Invite open" : "Invite paused"}</span>
          </div>

          {data.contributions.length === 0 ? (
            <div className="border-y border-white/10 py-16 text-center"><UsersRound size={30} className="mx-auto mb-3 text-[#ff9e4f]" /><h3 className="font-playfair text-2xl font-semibold">Waiting for the group</h3><p className="mt-2 text-sm text-white/40">Share the private link to collect the first memory.</p></div>
          ) : (
            <div className="divide-y divide-white/10 border-y border-white/10">
              {data.contributions.map((item) => (
                <article key={item.id} className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{item.name}</strong>
                      {item.relationship && <span className="text-xs text-white/40">{item.relationship}</span>}
                      <StatusPill status={item.status} />
                    </div>
                    {item.createdAt && <p className="mt-1 text-xs text-white/30">{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
                    {item.message && <p className="mt-4 max-w-2xl whitespace-pre-wrap leading-7 text-white/70">{item.message}</p>}
                    <div className="mt-4 flex flex-wrap items-start gap-4">
                      {item.photoUrl && <a href={item.photoUrl} target="_blank" rel="noreferrer"><img src={item.photoUrl} alt={`Contribution from ${item.name}`} className="h-28 w-36 rounded-lg object-cover" /></a>}
                      {item.voiceUrl && <div className="min-w-64"><div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-pink-200"><Mic size={13} /> Voice note</div><audio controls preload="metadata" className="h-10 max-w-full" src={item.voiceUrl} /></div>}
                    </div>
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <button type="button" onClick={() => moderate(item.id, "approved")} disabled={working === item.id || item.status === "approved"} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-3 text-xs font-semibold text-emerald-300 disabled:opacity-35"><Check size={14} /> Approve</button>
                    <button type="button" onClick={() => moderate(item.id, "rejected")} disabled={working === item.id || item.status === "rejected"} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 text-xs font-semibold text-rose-300 disabled:opacity-35"><UserRoundX size={14} /> Hide</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: ContributionStatus }) {
  const classes = status === "approved"
    ? "bg-emerald-400/10 text-emerald-300"
    : status === "rejected"
      ? "bg-rose-400/10 text-rose-300"
      : "bg-amber-300/10 text-amber-200";
  return <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${classes}`}>{status}</span>;
}