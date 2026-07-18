"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CAMPAIGNS, decodeMiniCard, type MiniCardData } from "@/lib/miniCard";

function Particles({ symbols }: { symbols: string[] }) {
  const [items, setItems] = useState<{ id: number; left: number; delay: number; dur: number; sym: string }[]>([]);
  useEffect(() => {
    setItems(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        dur: Math.random() * 6 + 7,
        sym: symbols[Math.floor(Math.random() * symbols.length)],
      }))
    );
  }, [symbols]);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>{`@keyframes miniFall{0%{transform:translateY(-10%) rotate(0);opacity:0}10%{opacity:.7}90%{opacity:.5}100%{transform:translateY(110vh) rotate(180deg);opacity:0}}`}</style>
      {items.map((p) => (
        <span key={p.id} className="absolute select-none" style={{ left: `${p.left}%`, top: "-5%", fontSize: "1.3rem", animation: `miniFall ${p.dur}s linear ${p.delay}s infinite` }}>
          {p.sym}
        </span>
      ))}
    </div>
  );
}

function CardView() {
  const params = useSearchParams();
  const [data, setData] = useState<MiniCardData | null | undefined>(undefined);

  useEffect(() => {
    const d = params.get("d");
    setData(d ? decodeMiniCard(d) : null);
  }, [params]);

  const campaign = useMemo(() => (data ? CAMPAIGNS[data.c] : null), [data]);

  useEffect(() => {
    if (campaign) {
      setTimeout(() => confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: ["#ff5f8f", "#ffb23e", "#ffffff", "#c084fc"] }), 500);
    }
  }, [campaign]);

  if (data === undefined) {
    return <main className="min-h-screen flex items-center justify-center bg-[#0a0612] text-white"><div className="text-4xl animate-bounce">💌</div></main>;
  }

  if (!data || !campaign) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0612] text-white px-6 text-center">
        <div className="text-5xl mb-4">💔</div>
        <h1 className="text-xl font-bold mb-2">This card link looks broken</h1>
        <Link href="/mini" className="text-purple-400 hover:text-purple-300 mt-2">Make a fresh one →</Link>
      </main>
    );
  }

  const c = campaign;
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-6 py-16 text-center overflow-hidden" style={{ background: c.bg, color: c.ink }}>
      <Particles symbols={c.particles} />
      <div className="relative z-10 max-w-md w-full">
        <div className="text-6xl mb-5" style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.3))" }}>{c.emoji}</div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: c.accent }}>{c.eyebrow}</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
          {c.greeting},<br />{data.to} {c.emoji}
        </h1>
        {data.msg && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: c.cardBg, border: `1px solid ${c.accent}33` }}>
            <p className="text-lg leading-relaxed italic opacity-90">“{data.msg}”</p>
          </div>
        )}
        {data.from && <p className="text-lg" style={{ color: c.accent }}>— {data.from}</p>}

        <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <p className="text-sm opacity-70 mb-4">Made with 💛 on Just4You.buzz</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white"
            style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}>
            Create your own surprise — from ₹149 →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0a0612]" />}>
      <CardView />
    </Suspense>
  );
}
