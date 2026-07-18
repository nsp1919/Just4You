import Link from "next/link";
import type { Metadata } from "next";
import { THEMES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Live Demos — See Every Theme | Just4You.buzz",
  description:
    "Explore live, interactive demos of every Just4You celebration website theme — Galaxy, Floral, Neon, Minimal, Retro and Magical. Try before you create.",
};

const OCCASION_LABEL: Record<string, string> = {
  galaxy: "Birthday",
  floral: "Anniversary",
  neon: "Birthday",
  minimal: "Birthday",
  retro: "Birthday",
  magical: "Kids Birthday",
};

export default function DemoIndexPage() {
  return (
    <main className="min-h-screen bg-[#0a0612] text-white px-5 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-400 mb-4">
            Live Demos
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            See every theme, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">for real</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Each demo is a fully interactive celebration website — the exact experience your loved
            one receives. Explore, then create your own in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((t) => (
            <Link
              key={t.id}
              href={`/demo/${t.id}`}
              className="group rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all bg-white/[0.03] hover:-translate-y-1"
            >
              <div
                className="h-40 w-full flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]}, ${t.preview[2]})`,
                }}
              >
                <span className="text-2xl font-bold drop-shadow-lg" style={{ color: "#fff" }}>
                  {t.label}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{t.label}</h3>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                    {OCCASION_LABEL[t.id] ?? "Birthday"}
                  </span>
                </div>
                <p className="text-sm text-white/55 leading-relaxed mb-4">{t.description}</p>
                <span className="text-sm font-semibold text-pink-400 group-hover:text-pink-300">
                  View live demo →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white"
            style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}
          >
            Create My Surprise — from ₹149 →
          </Link>
        </div>
      </div>
    </main>
  );
}
