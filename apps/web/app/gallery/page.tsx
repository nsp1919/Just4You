import Link from "next/link";
import type { Metadata } from "next";
import { getPublicCelebrationProof } from "@/lib/public-proof";

// Public "Wall of Love" — opt-in, admin-approved creations. Doubles as social
// proof and evergreen SEO content that funnels visitors into the create flow.

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Wall of Love — Real Surprise Websites | Just4You.buzz",
  description:
    "Browse real personalized birthday, anniversary and proposal surprise websites created on Just4You.buzz. Get inspired, then make your own from ₹199.",
  alternates: { canonical: "/gallery" },
};

const BIRTHDAY_URL = process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL || "";

export default async function GalleryPage() {
  const items = await getPublicCelebrationProof(30);

  return (
    <main className="min-h-screen bg-[#0a0612] text-white px-5 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-pink-300 mb-4">
            💛 Wall of Love
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Real surprises, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">real joy</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            A few of the celebrations people have shared publicly. Get inspired — then craft one of your own.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center text-white/50 py-16">
            The wall is just getting started. Be one of the first — create yours and opt in to be featured. 💫
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((c) => {
              return (
                <a
                  key={c.slug}
                  href={`${BIRTHDAY_URL}/wish/${c.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all bg-white/[0.03] hover:-translate-y-1"
                >
                  <div className="h-44 w-full overflow-hidden relative">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={`${c.occasionLabel} surprise for ${c.recipientName}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.12))" }}>
                        {c.occasionEmoji}
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,6,18,0.85), transparent 55%)" }} />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="font-bold text-lg drop-shadow">{c.recipientName}</div>
                      <div className="text-xs text-white/70">{c.occasionLabel} · 👁️ {c.views.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="text-center mt-16">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white"
            style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}
          >
            Create My Surprise — from ₹199 →
          </Link>
        </div>
      </div>
    </main>
  );
}
