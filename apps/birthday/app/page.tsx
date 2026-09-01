import Link from "next/link";

// The birthday-templates app primarily serves individual `/wish/[slug]` pages.
// This root page is a lightweight branded landing that showcases the available
// celebration themes and sends visitors to the main platform to create their own.
const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://just4you.buzz";

type Theme = {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  ring: string;
};

const THEMES: Theme[] = [
  { key: "galaxy", name: "Galaxy", emoji: "🌌", tagline: "Cosmic, dreamy & starlit", gradient: "linear-gradient(135deg,#1c0938 0%,#a855f7 60%,#ec4899 100%)", ring: "rgba(168,85,247,0.55)" },
  { key: "floral", name: "Floral", emoji: "🌸", tagline: "Soft, romantic & blooming", gradient: "linear-gradient(135deg,#7a2a52 0%,#e75480 55%,#ffd1e3 100%)", ring: "rgba(231,84,128,0.5)" },
  { key: "neon", name: "Neon", emoji: "⚡", tagline: "Electric, bold & glowing", gradient: "linear-gradient(135deg,#050505 0%,#00fff5 55%,#ff00ff 100%)", ring: "rgba(0,255,245,0.5)" },
  { key: "magical", name: "Magical", emoji: "✨", tagline: "Playful, whimsical & bright", gradient: "linear-gradient(135deg,#f9a8d4 0%,#fcd34d 50%,#6ee7b7 100%)", ring: "rgba(252,211,77,0.55)" },
  { key: "minimal", name: "Minimal", emoji: "🤍", tagline: "Quiet, clean & timeless", gradient: "linear-gradient(135deg,#1a1a1a 0%,#555 55%,#e5e5e5 100%)", ring: "rgba(180,180,180,0.5)" },
  { key: "retro", name: "Retro", emoji: "📷", tagline: "Vintage, warm & nostalgic", gradient: "linear-gradient(135deg,#2a1a0d 0%,#8b5a2b 55%,#e8d5b0 100%)", ring: "rgba(201,170,122,0.5)" },
];

// Static star field — baked into the server-rendered HTML (no hydration mismatch).
const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = ((i * 9301 + 49297) % 233280) / 233280;
  const r2 = ((i * 4931 + 7919) % 10000) / 10000;
  const r3 = ((i * 1327 + 3313) % 10000) / 10000;
  return {
    left: `${(r * 100).toFixed(2)}%`,
    top: `${(r2 * 100).toFixed(2)}%`,
    size: 1 + r3 * 2,
    delay: `${(r3 * 3).toFixed(2)}s`,
  };
});

export default function Home() {
  return (
    <main
      style={{ background: "#0c0812", color: "#fff5ec", overflowX: "hidden" }}
      className="relative min-h-screen w-full"
    >
      {/* Star field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, opacity: 0.6 }}
          />
        ))}
      </div>

      {/* Glow auras */}
      <div
        className="pointer-events-none absolute animate-float-slow"
        style={{ width: 620, height: 620, top: "-8%", left: "8%", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)", filter: "blur(70px)" }}
      />
      <div
        className="pointer-events-none absolute animate-float"
        style={{ width: 520, height: 520, bottom: "0%", right: "2%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,111,156,0.16) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-20 md:py-28">
        {/* Brand chip */}
        <div
          className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em]"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,224,196,0.16)", color: "#ffcf7a" }}
        >
          ✦ JUST4YOU ✦
        </div>

        {/* Hero */}
        <h1
          className="font-playfair animate-fade-in-up max-w-3xl text-center text-5xl font-bold leading-tight md:text-7xl"
          style={{ background: "linear-gradient(135deg,#fff 0%,#ffcf7a 45%,#ff6f9c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
        >
          Celebrations they&apos;ll treasure forever
        </h1>
        <p
          className="animate-fade-in-up mt-6 max-w-xl text-center text-lg leading-relaxed md:text-xl"
          style={{ color: "#b9a6be", animationDelay: "0.15s" }}
        >
          Beautiful, personalized surprise pages for birthdays, anniversaries &amp; every moment
          worth remembering — with photos, music &amp; heartfelt messages.
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up mt-9 flex flex-col items-center gap-4 sm:flex-row" style={{ animationDelay: "0.3s" }}>
          <a
            href={MAIN_APP_URL}
            className="flex items-center justify-center rounded-full px-8 py-4 text-base font-bold transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg,#ffcf7a,#ff6f9c)", color: "#2a0d1a", boxShadow: "0 12px 40px rgba(255,111,156,0.35)" }}
          >
            Create your own surprise →
          </a>
          <Link
            href="/demo/galaxy"
            className="flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", color: "#fff5ec" }}
          >
            View a live demo
          </Link>
        </div>

        {/* Theme showcase */}
        <div className="mt-20 w-full">
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: "#8a7a90" }}>
            Six handcrafted themes
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t, i) => (
              <Link
                key={t.key}
                href={`/demo/${t.key}`}
                className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-3xl transition-transform hover:-translate-y-1"
                style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", animationDelay: `${0.1 * i}s` }}
              >
                <div
                  className="relative h-36 w-full transition-transform duration-500 group-hover:scale-105"
                  style={{ background: t.gradient }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-lg">
                    {t.emoji}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-playfair text-xl font-bold" style={{ color: "#fff5ec" }}>{t.name}</h3>
                    <span
                      className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "#ffcf7a" }}
                    >
                      View →
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "#b9a6be" }}>{t.tagline}</p>
                </div>
                <span
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ boxShadow: `0 0 0 1px ${t.ring}, 0 18px 50px -12px ${t.ring}` }}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center">
          <p className="text-sm" style={{ color: "#6f6276" }}>
            Made with <span style={{ color: "#ff6f9c" }}>♥</span> on{" "}
            <a href={MAIN_APP_URL} style={{ color: "#ffcf7a" }} className="font-medium hover:underline">
              Just4You
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
