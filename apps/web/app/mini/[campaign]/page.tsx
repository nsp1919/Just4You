"use client";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { CAMPAIGNS, encodeMiniCard } from "@/lib/miniCard";
import { trackEvent } from "@/lib/analytics";

export default function MiniCreatePage({ params }: { params: Promise<{ campaign: string }> }) {
  const { campaign } = use(params);
  const c = CAMPAIGNS[campaign];
  if (!c) notFound();

  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!to.trim()) return "";
    const d = encodeMiniCard({ c: c.id, to: to.trim().slice(0, 40), from: from.trim().slice(0, 40), msg: msg.trim().slice(0, 240) });
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/card?d=${d}`;
  }, [to, from, msg, c.id]);

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    trackEvent("mini_card_created", { campaign: c.id });
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = () => {
    if (!shareUrl) return;
    trackEvent("mini_card_shared", { campaign: c.id });
    window.open(`https://wa.me/?text=${encodeURIComponent(`${c.emoji} ${c.greeting}, ${to}!\n\n${shareUrl}`)}`, "_blank");
  };

  return (
    <main className="min-h-screen px-5 py-14" style={{ background: c.bg, color: c.ink }}>
      <div className="max-w-lg mx-auto">
        <Link href="/mini" className="inline-flex items-center gap-1.5 text-sm mb-8 opacity-60 hover:opacity-100">
          <ArrowLeft size={16} /> All free cards
        </Link>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{c.emoji}</div>
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: c.accent }}>{c.eyebrow}</p>
          <h1 className="text-3xl font-bold">Send a free {c.label} card</h1>
          <p className="opacity-60 text-sm mt-2">Fill it in, share the link — no sign-up needed. 💫</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: c.cardBg, border: `1px solid ${c.accent}33` }}>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To (their name) *" maxLength={40}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${c.accent}33`, color: c.ink }} />
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={c.placeholderMsg} rows={3} maxLength={240}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${c.accent}33`, color: c.ink }} />
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From (your name)" maxLength={40}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${c.accent}33`, color: c.ink }} />
        </div>

        {shareUrl ? (
          <div className="mt-6 space-y-3">
            <a href={shareUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold"
              style={{ background: c.accent, color: "#1a0610" }}>
              Preview the card <ArrowRight size={16} />
            </a>
            <div className="flex gap-2">
              <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${c.accent}33`, color: c.ink }}>
                {copied ? <><Check size={15} className="text-green-400" /> Copied</> : <><Copy size={15} /> Copy link</>}
              </button>
              <button onClick={whatsapp} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: "#25D366" }}>
                WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm opacity-50 mt-6">Add their name to generate a shareable link.</p>
        )}

        {/* Upsell */}
        <div className="mt-10 rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-sm opacity-80 mb-3">Want to make it truly unforgettable — with photos, music &amp; a full animated website?</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white"
            style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}>
            Create a full surprise — from ₹199 →
          </Link>
        </div>
      </div>
    </main>
  );
}
