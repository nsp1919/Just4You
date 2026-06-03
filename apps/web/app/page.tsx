"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { THEMES, PRICE_INR } from "@/lib/constants";
import { Sparkles, Upload, CreditCard, Share2, Star, ChevronDown, Play, Check, ArrowRight, Gift, Heart, Music, Camera } from "lucide-react";

// ─── Floating particles ─────────────────────────────────────────────────────
function Stars() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate stars only on the client to avoid SSR/CSR hydration mismatch
    setStars(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 4,
        duration: Math.random() * 3 + 2,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,6,18,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(168,85,247,0.15)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="text-xl font-bold gradient-text">Just4You</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-muted)]">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#occasions" className="hover:text-white transition-colors">Occasions</a>
          <a href="#themes" className="hover:text-white transition-colors">Themes</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm py-2 px-5">Sign In</Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-5">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 overflow-hidden">
      <Stars />
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />
      <div className="absolute top-2/3 left-1/4 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-[var(--accent-gold)] mb-8 animate-fade-in">
          <Sparkles size={14} />
          <span>India's premium multi-occasion animated surprise website creator</span>
          <Sparkles size={14} />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up font-playfair">
          Create an Unforgettable Surprise{" "}
          <span className="gradient-text">for Your Loved Ones</span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Surprise them with a stunning personalized website for <strong>Birthdays</strong>, <strong>Anniversaries</strong>, <strong>Proposals</strong>, or <strong>Kids Birthdays</strong>. Beautiful animated themes, photo slideshows, heartfelt letters & background music. Share in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Link href="/register" className="btn-primary text-base py-4 px-8 glow-purple">
            <Gift size={20} /> Create a Surprise Website
          </Link>
          <a href="#demo" className="btn-ghost text-base py-4 px-8">
            <Play size={18} /> See a Live Demo
          </a>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[var(--text-muted)] animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex -space-x-2">
            {["🧑🏻", "👩🏽", "🧑🏾", "👩🏻", "🧑🏿"].map((e, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-purple-900 border border-purple-700 flex items-center justify-center text-sm">{e}</div>
            ))}
          </div>
          <span>Join <strong className="text-white">2,800+</strong> thrilled creators who surprised their favorite people</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} fill="#f59e0b" stroke="none" />
            ))}
            <span className="ml-1">4.9/5</span>
          </div>
        </div>

        {/* Floating cards */}
        <div className="relative mt-20 h-64 hidden md:block">
          <div className="absolute left-0 top-4 glass-card p-4 animate-float text-left max-w-56">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-pink-400" />
              <span className="text-xs text-[var(--text-muted)]">Occasion selected</span>
            </div>
            <div className="text-2xl font-bold gradient-text">Marriage Anniversary 💍</div>
            <div className="text-xs text-green-400 mt-1">✓ Romantic Rose Gold vibe</div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 glass-card p-4 animate-float-delayed text-center max-w-64">
            <div className="text-3xl mb-2">✨</div>
            <div className="text-sm font-semibold">Your surprise website is live!</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">just4you.in/wish/our-forever</div>
            <div className="text-xs text-green-400 mt-2">Shared on WhatsApp → 89 views</div>
          </div>
          <div className="absolute right-0 top-4 glass-card p-4 animate-float text-left max-w-56" style={{ animationDelay: "1s" }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-xs text-[var(--text-muted)]">Interactive Proposal</span>
            </div>
            <div className="text-sm font-semibold">She Said YES! 💍💖</div>
            <div className="text-xs text-pink-400 mt-1">✓ Floating rings celebration</div>
            <div className="text-xs text-green-400 mt-2">Clicked on 31 May</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-[var(--text-muted)]">
        <ChevronDown size={24} />
      </div>
    </section>
  );
}

// ─── Occasions ───────────────────────────────────────────────────────────────
function Occasions() {
  const occasions = [
    { emoji: "🎂", title: "Birthdays", desc: "Showcase their best moments, floating stars, personal inside jokes, and relationships tailored for friends, parents, siblings or partners." },
    { emoji: "🧸", title: "Kids Birthdays", desc: "A colorful, magical kid-friendly wonderland featuring floating balloons, bouncers, unicorns, and rainbow confetti!" },
    { emoji: "💍", title: "Marriage Anniversary", desc: "Celebrate your milestone. Romantic, elegant letter formats and nostalgic image slide transitions with classy background music." },
    { emoji: "💌", title: "Surprise Proposals", desc: "Pop the question in the most memorable digital way. Features a spectacular, fully interactive 'She/He Said YES! 💍' confetti explosion." }
  ];

  return (
    <section id="occasions" className="py-28 px-6 bg-[rgba(168,85,247,0.02)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-playfair mb-4">
            Surprise for <span className="gradient-text">Every Celebration</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg">Relationship-aware content tailored beautifully for each occasion</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {occasions.map((o, i) => (
            <div key={i} className="glass-card p-6 border-purple-500/10 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-4">{o.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{o.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: <Upload size={28} />, step: "01", title: "Choose & Fill Details", desc: "Select your occasion (Birthday, Anniversary, Kids, or Proposal) and relation. Write your custom heartfelt letter." },
    { icon: <Camera size={28} />, step: "02", title: "Upload 8 Photos", desc: "Drag & drop your favourite memories. They'll be beautifully arranged in an animated custom slideshow." },
    { icon: <CreditCard size={28} />, step: "03", title: "Flat ₹299", desc: "One-time secure checkout via Razorpay (UPI, GPay, PhonePe, Cards, Netbanking)." },
    { icon: <Share2 size={28} />, step: "04", title: "Share the Surprise!", desc: "Your website goes live instantly. Send the unique link on WhatsApp and wait for the emotional reaction!" },
  ];

  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-playfair mb-4">
            Ready in <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg">From idea to live personalized website in under 5 minutes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="glass-card p-6 relative group hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[var(--accent-gold)]"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                {s.step}
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-purple-400"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                {s.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-purple-600">
                  <ArrowRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Themes Preview ──────────────────────────────────────────────────────────
function ThemesPreview() {
  const [active, setActive] = useState(0);
  const theme = THEMES[active];

  const themePreview = [
    { emoji: "🌌", bg: "from-[#0f0c29] via-[#302b63] to-[#24243e]", text: "text-yellow-300", sample: "You are my entire universe ✨", sub: "Deep space vibes with animated starfield & nebula" },
    { emoji: "🌸", bg: "from-[#fff0f5] via-[#ffe4ec] to-[#ffd6e8]", text: "text-rose-600", sample: "Happy Anniversary, Sweetheart 🌸", sub: "Soft petals, gold borders & romantic elegance" },
    { emoji: "⚡", bg: "from-[#0a0a0a] via-[#111] to-[#050505]", text: "text-cyan-400", sample: "NEVER GROW OLD ⚡", sub: "Electric neon cyberpunk vibes with particle explosions" },
    { emoji: "🤍", bg: "from-white via-[#f8f8ff] to-white", text: "text-indigo-600", sample: "Every day with you is a gift 🎁", sub: "Minimalist, generous spacing & pure typography" },
    { emoji: "🎞️", bg: "from-[#2c1810] via-[#3d2314] to-[#1e1008]", text: "text-amber-400", sample: "Time stops when I'm with you 🎞️", sub: "Warm vintage film grain, typewriter letter & sepia charm" },
    { emoji: "🎈", bg: "from-[#fff7ed] via-[#fdf2f8] to-[#ecfdf5]", text: "text-pink-600", sample: "Happy 5th Birthday, Princess! 🧸🎈", sub: "Playful balloons, stars, rainbow gradients & bouncy toys" },
  ];

  const p = themePreview[active];

  return (
    <>
      <span id="themes" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <section id="demo" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-playfair mb-4">
              6 Stunning <span className="gradient-text">Surprise Themes</span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg">Each theme is fully animated, responsive &amp; mobile-optimized</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Theme selector */}
            <div className="flex flex-col gap-3">
              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActive(i)}
                  className={`p-4 rounded-2xl text-left transition-all duration-300 flex items-center gap-4 ${active === i
                      ? "border border-purple-500/60 glow-purple"
                      : "glass border border-transparent hover:border-purple-500/30"
                    }`}
                  style={{ background: active === i ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-1">
                    {t.preview.map((c, j) => (
                      <div key={j} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{t.description}</div>
                  </div>
                  {active === i && <Check size={16} className="ml-auto text-purple-400" />}
                </button>
              ))}
            </div>

            {/* Live preview */}
            <div className="relative">
              <div className={`rounded-3xl overflow-hidden h-80 bg-gradient-to-br ${p.bg} flex flex-col items-center justify-center p-8 text-center relative shadow-2xl`}
                style={{ boxShadow: `0 0 60px ${theme.preview[1]}40` }}>
                <div className="text-5xl mb-4">{p.emoji}</div>
                <div className={`text-2xl font-bold font-playfair mb-2 ${p.text}`}>{p.sample}</div>
                <div className="text-sm opacity-70 mb-4 text-[var(--text-muted)]">{p.sub}</div>
                <div className="flex gap-2">
                  {["📸", "🎵", "🎊", "💌"].map((e, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">{e}</div>
                  ))}
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 text-xs opacity-50">just4you.in/wish/demo</div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <Link href="/register" className="btn-primary text-sm py-2 px-6">
                  Use this Theme <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: "🎊", title: "Confetti Explosion", desc: "Spectacular animated confetti/balloons burst on page load for immediate wow factor" },
    { icon: "🎵", title: "Background Music", desc: "8 high-quality preset tracks or upload your custom MP3 soundtrack" },
    { icon: "💍", title: "Interactive Proposal", desc: "Animated 'Say YES! 💍' click responses with romantic floating animations" },
    { icon: "📸", title: "Ken Burns Slideshow", desc: "Smooth image zooming & panning effects with custom memory photo frame" },
    { icon: "🧸", title: "Kids Wonderland", desc: "Custom playful balloons, candy, unicorns, and toy floaters for young ones" },
    { icon: "📱", title: "WhatsApp Preview", desc: "Gorgeous social cards that display their name and photo when sharing the link" },
    { icon: "🔒", title: "1 Full Year Validity", desc: "Your custom celebration page remains completely active for 365 days" },
    { icon: "💌", title: "Instant Delivery", desc: "Surprise link is generated instantly and sent to your email after checkout" },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair mb-4">
            Everything You <span className="gradient-text">Need & More</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg">Designed to trigger emotional smiles, goosebumps, and tears of joy</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="glass-card p-5 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const included = [
    "6 gorgeous interactive animated themes",
    "Up to 8 custom photos in slideshow",
    "Tailored occasion-specific letters & titles",
    "Interactive Proposal 'YES! 💍' response tracker",
    "Upload custom music files (MP3)",
    "Bouncy balloon floating effects (Kids Birthday)",
    "WhatsApp share preview cards",
    "1 year full validity hosting",
    "Instant delivery to your email",
  ];

  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-playfair mb-4">
            Simple, <span className="gradient-text">Flat Pricing</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg">No subscriptions. Pay once, surprise them forever.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Price card */}
          <div className="glass-card p-8 relative overflow-hidden border-purple-500/40 glow-purple">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
              🔥 All-Inclusive Surprises
            </div>
            <div className="mb-6">
              <div className="text-5xl font-bold gradient-text mb-1">₹299</div>
              <div className="text-[var(--text-muted)]">flat rate per custom website</div>
            </div>
            <ul className="space-y-3 mb-8">
              {included.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-green-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-primary w-full justify-center text-base py-4 animate-pulse">
              Create My Just4You Website <ArrowRight size={18} />
            </Link>
          </div>
          {/* Compare */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Why ₹299 is incredible value</h3>
            {[
              { label: "Hire a professional designer", price: "₹2,500+", cross: true },
              { label: "Traditional physical gift hamper", price: "₹1,500+", cross: true },
              { label: "Fancy dinner or movie tickets", price: "₹1,000+", cross: true },
              { label: "Just4You custom surprise", price: "₹299", cross: false, highlight: true },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${r.highlight ? "border border-purple-500/50 glow-purple" : "glass"
                }`}
                style={{ background: r.highlight ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)" }}>
                <span className={`text-sm ${r.cross ? "line-through text-[var(--text-muted)]" : "font-semibold"}`}>
                  {r.label}
                </span>
                <span className={`font-bold ${r.highlight ? "gradient-text" : "text-[var(--text-muted)]"}`}>
                  {r.price}
                </span>
              </div>
            ))}
            <div className="text-xs text-[var(--text-muted)] text-center mt-2">
              💳 Powered by Razorpay — Secure payment via UPI, PhonePe, Cards, Netbanking
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: "Priya Sharma", city: "Mumbai", avatar: "👩🏽", rating: 5, text: "I made this for my husband for our 3rd anniversary. He literally had tears in his eyes when he opened the link! The rose gold Floral theme was absolutely stunning. Best ₹299 spent." },
    { name: "Rohan Kapoor", city: "Delhi", avatar: "🧑🏻", rating: 5, text: "I proposed using the custom Proposal theme! The interactive YES button exploded with hearts, and she loved seeing all our memories playing to 'Guitar Serenade'. A core memory for us!" },
    { name: "Sneha Reddy", city: "Hyderabad", avatar: "👩🏾", rating: 5, text: "Used the Kids Magical theme for my nephew's 5th birthday. The floating balloons, balloons pop and candy icons were so cute! Kids kept playing with the screen. 100% recommend!" },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair mb-4">
            Real Stories, <span className="gradient-text">Real Smiles</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg">See how Just4You makes special moments absolutely magical</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="glass-card p-6 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="#f59e0b" stroke="none" />
                ))}
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{r.avatar}</div>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{r.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "What occasions does Just4You support?", a: "We support Birthdays, Kids Birthdays (magical theme), Marriage Anniversaries, and Proposals! We offer tailored, relationship-aware templates that dynamically adjust letter formats and floating animations." },
    { q: "How long does it take to create a Just4You website?", a: "Less than 5 minutes! Simply select your occasion, fill in details (recipient name, relationship, letter), upload up to 8 photo memories, pick your background music track, and complete the secure payment. Your website goes live instantly." },
    { q: "How do I share the surprise website?", a: "You'll get a unique link like just4you.in/wish/abc123. When you copy and share this link on WhatsApp or Instagram, it renders a high-quality preview card showing the recipient's name and celebration type." },
    { q: "Can I upload my own background music?", a: "Absolutely! You can choose from our 8 high-quality preset tracks (acoustic guitar, romantic piano, upbeat pop) or upload a custom MP3 file of your choice." },
    { q: "For how long will the surprise website stay live?", a: "Every surprise website stays live for a full 1 year (365 days) from the date of creation. The recipient can open, play music, and revisit it as many times as they wish." },
    { q: "Can I edit the website after creating it?", a: "Yes, you can edit the text message/letter content within 24 hours of creation. To make other edits or photo corrections, you can reach out to our active customer support." },
  ];

  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair mb-4">
            Got <span className="gradient-text">Questions?</span>
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4"
              >
                <span className="font-medium text-sm">{f.q}</span>
                <ChevronDown size={16} className={`text-purple-400 flex-shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-[var(--text-muted)] leading-relaxed border-t border-purple-500/10">
                  <div className="pt-4">{f.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.1) 100%)" }}>
          <div className="absolute inset-0 star-bg opacity-30" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">💖</div>
            <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-4">
              Celebrate Their Special Day in Style
            </h2>
            <p className="text-[var(--text-muted)] mb-8 text-lg">
              Don't just send a plain, forgettable WhatsApp text. Give them a premium, beautiful animated surprise they'll <em>remember forever.</em>
            </p>
            <Link href="/register" className="btn-primary text-lg py-5 px-10 glow-purple">
              <Heart size={20} /> Create a Surprise Website — ₹299
            </Link>
            <div className="mt-4 text-xs text-[var(--text-muted)]">
              ✓ Instantly Live &nbsp;&nbsp; ✓ Secure Razorpay Gateway &nbsp;&nbsp; ✓ 1 Year Validity
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-purple-500/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="font-bold gradient-text">Just4You</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          Made with <Heart size={12} className="inline text-pink-500" /> in India © 2026 Just4You
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      <Navbar />
      <Hero />
      <Occasions />
      <HowItWorks />
      <ThemesPreview />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  );
}
