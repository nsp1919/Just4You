import Link from "next/link";
import type { Metadata } from "next";
import { CAMPAIGNS } from "@/lib/miniCard";

export const metadata: Metadata = {
  title: "Free Greeting Cards — Valentine's, Diwali, Rakhi & More | Just4You.buzz",
  description:
    "Send a free personalized greeting card in seconds — Valentine's Day, Diwali, Friendship Day, Raksha Bandhan and birthdays. No sign-up. Share on WhatsApp instantly.",
  alternates: { canonical: "/mini" },
};

export default function MiniIndexPage() {
  const list = Object.values(CAMPAIGNS);
  return (
    <main className="min-h-screen bg-[#0a0612] text-white px-5 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-pink-300 mb-4">
            Free · No sign-up
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Send a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">free card</span> in seconds
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Pick an occasion, personalize it, and share the link on WhatsApp instantly. Want more? Upgrade to a full animated surprise website.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/mini/${c.id}`}
              className="rounded-2xl p-6 text-center border border-white/10 hover:border-white/25 transition-all bg-white/[0.03] hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">{c.emoji}</div>
              <div className="font-semibold">{c.label}</div>
              <div className="text-xs mt-1" style={{ color: c.accent }}>Send free →</div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/pricing" className="text-purple-400 hover:text-purple-300 font-semibold">
            Or build a full surprise website — from ₹199 →
          </Link>
        </div>
      </div>
    </main>
  );
}
