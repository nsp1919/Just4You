"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Share2, Copy, Check, Volume2, VolumeX, ChevronDown, Heart } from "lucide-react";
import { getOccasionContent } from "../../lib/occasionContent";
import StoryCardModal from "../StoryCardModal";
import ReactionWall from "../ReactionWall";
import VoiceMessagePlayer from "../VoiceMessagePlayer";
import VideoMessagePlayer from "../VideoMessagePlayer";
import ViewCounter from "../ViewCounter";
import { Tilt3D, Parallax, Reveal3D, Hero3D } from "./Scroll3D";

interface Celebration {
  id?: string;
  recipientName: string;
  birthdayDate: string;
  message: string;
  photos: string[];
  musicType: string;
  musicPresetId?: string;
  musicUploadUrl?: string;
  voiceMessageUrl?: string;
  videoMessageUrl?: string;
  expiresAt: any;
  occasionType?: any;
  relation?: any;
  relationCustom?: any;
  views?: number;
}

// ─── Hook: scroll-triggered visibility ────────────────────────────────────────
function useInView(threshold = 0.25) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated line wrapper ─────────────────────────────────────────────────────
function AnimLine({
  children, delay = 0, className = "", from = "bottom", style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: "bottom" | "left" | "right" | "scale";
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView(0.2);
  const init: Record<string, string> = {
    bottom: "translateY(40px)", left: "translateX(-50px)",
    right: "translateX(50px)", scale: "scale(0.85)",
  };
  return (
    <div ref={ref as any} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : init[from],
      transition: `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Glowing divider ─────────────────────────────────────────────────────────
function GlowDivider() {
  const { ref, inView } = useInView();
  return (
    <div ref={ref as any} className="flex items-center gap-4 my-6 max-w-xs mx-auto w-full"
      style={{ opacity: inView ? 1 : 0, transition: "opacity 1s ease" }}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
      <Heart size={14} className="text-pink-400 flex-shrink-0" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-400/60 to-transparent" />
    </div>
  );
}

// ─── Music Player ─────────────────────────────────────────────────────────────
function MusicPlayer({ celebration }: { celebration: Celebration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const trackUrl =
    celebration.musicType === "upload" ? celebration.musicUploadUrl
      : celebration.musicType === "preset" && celebration.musicPresetId
        ? `/music/${celebration.musicPresetId}.mp3` : null;
  if (!trackUrl) return null;
  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => { }); setPlaying(true); }
  };
  return (
    <>
      <audio ref={audioRef} src={trackUrl} loop />
      <button onClick={toggle}
        className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(168,85,247,0.35)", border: "1px solid rgba(168,85,247,0.7)", backdropFilter: "blur(12px)" }}>
        {playing ? <Volume2 size={18} color="white" /> : <VolumeX size={18} color="white" />}
      </button>
    </>
  );
}

// ─── Share Bar ────────────────────────────────────────────────────────────────
function ShareBar({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const wa = () => window.open(`https://wa.me/?text=${encodeURIComponent(`🎂 Happy Birthday ${name}! I made this for you ❤️\n${url}`)}`, "_blank");
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button onClick={wa} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:scale-105" style={{ background: "#25d366" }}>
        <Share2 size={13} /> WhatsApp
      </button>
      <button onClick={copy} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }}>
        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

// ─── Stars background ─────────────────────────────────────────────────────────
function Stars() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; dur: number }[]>([]);
  useEffect(() => {
    setStars(Array.from({ length: 180 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5, delay: Math.random() * 6, dur: Math.random() * 3 + 2,
    })));
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: 0.65,
            animation: `bgTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite alternate`
          }} />
      ))}
    </div>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
function FloatingParticles({ list = ["✨", "⭐", "💫", "·", "✦", "✧"] }: { list?: string[] }) {
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; dur: number; sym: string }[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 22 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 12,
      dur: Math.random() * 8 + 6, sym: list[Math.floor(Math.random() * list.length)],
    })));
  }, [list]);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <span key={p.id} className="absolute text-yellow-300/25 text-sm select-none"
          style={{ left: `${p.x}%`, bottom: "-5%", animation: `bgFloat ${p.dur}s linear ${p.delay}s infinite` }}>
          {p.sym}
        </span>
      ))}
    </div>
  );
}

// ─── Occasion-aware photo captions ──────────────────────────────────────────
const PHOTO_CAPTIONS_BY_OCCASION: Record<string, string[]> = {
  birthday: [
    "Every picture tells a story, and yours is my favourite.",
    "In every smile, I see a thousand reasons to celebrate you.",
    "You light up every room, every photo, every memory.",
    "Some people make the world more special just by being in it.",
    "Life is more beautiful because you're in it — this proves it.",
    "This moment — I want to hold onto it forever. ✨",
    "You make every memory worth keeping and every day worth living.",
    "The moments we capture are the ones that last a lifetime.",
  ],
  anniversary: [
    "Every year with you only makes me fall deeper in love.",
    "A love story written in starlight — and it's still going.",
    "Two hearts, one universe, infinite beautiful memories.",
    "Here's to every moment that led us here — and all the ones ahead.",
    "The stars aligned for us. This is the proof.",
    "Still choosing you, every single day, without hesitation.",
    "Love like this doesn't fade — it only grows brighter with time.",
    "Our story: still the most beautiful thing I've ever been a part of.",
  ],
  proposal: [
    "This is the moment the stars rearranged themselves for us.",
    "Before you, I didn't believe in forever. After you, I do.",
    "The universe conspired to bring us here. To this exact frame.",
    "You are my answered prayer, my wildest dream come true.",
    "I searched the entire galaxy and still chose you. Always you.",
    "The beginning of our forever — right here in the stars.",
    "My heart knew before my mind could form the words: it's you.",
    "Two souls, one destiny — and I wouldn't have it any other way.",
  ],
  "kids-birthday": [
    "A little star shining brighter than the whole galaxy. 🌟",
    "Pure magic, wrapped in the most adorable human being ever.",
    "Every giggle echoes through the entire universe. 🌈",
    "The cutest explorer in all of space — right here.",
    "Some people are born to make the world infinitely more wonderful.",
    "Tiny, mighty, and endlessly loved — our little star.",
    "This smile? It could outshine every star in the sky. ⭐",
    "Adventures in childhood: the most magical journey of all.",
  ],
};

function PhotoCard({ url, caption, index }: { url: string; caption: string; index: number }) {
  const { ref, inView } = useInView(0.12);
  const isLeft = index % 2 === 0;
  return (
    <div ref={ref as any}
      className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-4xl mx-auto w-full px-4"
      style={{
        flexDirection: isLeft ? undefined : "row-reverse",
        opacity: inView ? 1 : 0,
        transition: `opacity 1s ease ${index * 80}ms`,
      }}>
      {/* Photo */}
      <Tilt3D className="flex-shrink-0 w-full md:w-64" direction={isLeft ? 1 : -1}>
        <div className="h-64 md:h-72 overflow-hidden rounded-3xl relative group"
          style={{ boxShadow: "0 20px 60px rgba(168,85,247,0.3), 0 0 0 1px rgba(168,85,247,0.2)" }}>
          <img src={url} alt={caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top, rgba(10,8,21,0.7) 0%, transparent 50%)" }} />
          <div className="absolute bottom-3 right-3 text-white/50 text-xs tracking-widest" style={{ fontFamily: "Georgia, serif" }}>
            Photo {index + 1}
          </div>
        </div>
      </Tilt3D>
      {/* Caption */}
      <Parallax className={`flex-1 ${isLeft ? "text-left" : "text-left md:text-right"}`} distance={38}>
        <div className="text-5xl mb-3 text-white/30" style={{ fontFamily: "serif", lineHeight: 1 }}>"</div>
        <p className="text-xl md:text-2xl leading-relaxed text-white/80 italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {caption}
        </p>
        <div className="mt-5 w-12 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
          style={{ marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0 }} />
      </Parallax>
    </div>
  );
}

// ─── "Why You're Special" card — extracted to avoid hook-in-loop ──────────────
function SpecialCard({ emoji, text, index }: { emoji: string; text: string; index: number }) {
  return (
    <Reveal3D index={index}
      className="flex items-center gap-4 p-5 rounded-2xl text-left transition-colors hover:border-purple-500/40"
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(12px)",
      }}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <p className="text-lg text-white/85" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{text}</p>
    </Reveal3D>
  );
}

// ─── Finale confetti trigger ──────────────────────────────────────────────────
function FinaleConfetti() {
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (inView) {
      setTimeout(() => confetti({
        particleCount: 90, spread: 75, origin: { y: 0.7 },
        colors: ["#a855f7", "#f7d971", "#ec4899", "#60a5fa"],
      }), 400);
    }
  }, [inView]);
  return (
    <div ref={ref as any} className="font-dancing gradient-text-rose text-3xl select-none"
      style={{
        fontFamily: "'Dancing Script', cursive",
        opacity: inView ? 1 : 0,
        transition: "opacity 1.2s ease",
      }}>
      Made with love ❤️
    </div>
  );
}

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@500;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

  @keyframes bgTwinkle  { from { opacity:0.15; } to { opacity:0.85; } }
  @keyframes bgFloat    { 0%{transform:translateY(0) rotate(0deg);opacity:0} 10%{opacity:1} 90%{opacity:0.4} 100%{transform:translateY(-100vh) rotate(20deg);opacity:0} }
  @keyframes bgFloat2   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes bgHeartbeat{ 0%,100%{transform:scale(1)} 14%{transform:scale(1.35)} 28%{transform:scale(1)} 42%{transform:scale(1.15)} 70%{transform:scale(1)} }
  @keyframes bgShimmer  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  .bg-galaxy-page { background: #0a0815; }
  .font-dancing   { font-family:'Dancing Script',cursive; }
  .font-playfair  { font-family:'Playfair Display',Georgia,serif; }
  .font-cormorant { font-family:'Cormorant Garamond',Georgia,serif; }

  .gradient-text-gold {
    background: linear-gradient(135deg,#fff 0%,#f7d971 40%,#a855f7 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; animation: bgShimmer 5s ease infinite;
  }
  .name-aura {
    position:absolute; inset:-30% -14%; z-index:0; pointer-events:none;
    background: radial-gradient(ellipse at center, rgba(247,217,113,0.28) 0%, rgba(168,85,247,0.14) 45%, transparent 72%);
    filter: blur(34px);
    animation: bgFloat2 4.5s ease-in-out infinite;
  }
  .gradient-text-rose {
    background: linear-gradient(135deg,#f9a8d4 0%,#ec4899 50%,#f7d971 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .nebula-purple {
    position:absolute; border-radius:50%;
    background:radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%);
    filter:blur(65px); pointer-events:none;
  }
  .nebula-pink {
    position:absolute; border-radius:50%;
    background:radial-gradient(circle,rgba(236,72,153,0.13) 0%,transparent 70%);
    filter:blur(80px); pointer-events:none;
  }
  .glass-card {
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.1);
    backdrop-filter:blur(20px);
    border-radius:24px;
  }
`;

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function GalaxyTheme({ celebration }: { celebration: Celebration }) {
  const [heartBeat, setHeartBeat] = useState(false);
  const [yesResponse, setYesResponse] = useState(false);

  const content = getOccasionContent(
    celebration.occasionType || "birthday",
    celebration.relation || "friend",
    celebration.relationCustom || "",
    celebration.recipientName
  );

  useEffect(() => {
    const t = setTimeout(() => {
      confetti({
        particleCount: 150, spread: 100, origin: { y: 0.55 },
        colors: content.confettiColors
      });
    }, 1300);
    return () => clearTimeout(t);
  }, [content.confettiColors]);

  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
  const firstName = celebration.recipientName.split(" ")[0];
  const messageLines: string[] = (celebration.message || "").split(/\n+/).filter(Boolean);
  const specialItems = content.specialItems;

  const handleProposalYes = () => {
    setYesResponse(true);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ["#ff3366", "#ff66b2", "#ff99cc", "#ffffff"] });
  };

  return (
    <main className="bg-galaxy-page" style={{ color: "white", overflowX: "hidden", fontFamily: "Georgia, serif" }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <FloatingParticles list={content.particles} />

      {/* ══ SCENE 1: Opening ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6"
        style={{ background: "linear-gradient(180deg, #0a0815 0%, #0f0a22 100%)" }}>
        <Stars />
        <div className="nebula-purple" style={{ width: 600, height: 600, top: "5%", left: "15%" }} />
        <div className="nebula-pink" style={{ width: 500, height: 500, bottom: "5%", right: "5%" }} />

        <Hero3D className="relative z-10 max-w-3xl">
          <div className="text-7xl mb-6" style={{ animation: "bgFloat2 3.5s ease-in-out infinite" }}>{content.heroEmoji}</div>
          <p className="font-cormorant text-xl md:text-2xl text-purple-300/80 tracking-[0.35em] uppercase mb-5">
            {content.heroSubtitle}
          </p>
          <div className="relative inline-block mb-7">
            <span className="name-aura" />
            <h1 className="font-dancing gradient-text-gold leading-tight relative" style={{ fontSize: "clamp(3.5rem, 11vw, 7rem)" }}>
              {celebration.recipientName}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-5 mb-8">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-purple-500/60" />
            <span className="text-purple-400 text-xl">✦</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-pink-500/60" />
          </div>
          <p className="font-cormorant text-xl md:text-2xl italic text-white/60 leading-relaxed">
            The world became more beautiful because you are in it.
          </p>
        </Hero3D>

        <button onClick={scrollDown}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors z-10"
          style={{ animation: "bgFloat2 2s ease-in-out infinite" }}>
          <span className="font-cormorant text-sm tracking-widest">Scroll</span>
          <ChevronDown size={20} />
        </button>
      </section>

      {/* ══ SCENE 2: Happy Birthday ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20"
        style={{ background: "radial-gradient(ellipse at top, #1c0938 0%, #0a0815 70%)" }}>
        <Stars />
        <div className="nebula-purple" style={{ width: 450, height: 450, top: "10%", right: "5%" }} />
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-cormorant text-lg text-purple-300/70 tracking-[0.35em] uppercase mb-6" delay={0}>
            Today is a special day
          </AnimLine>
          <AnimLine delay={120} from="scale">
            <h2 className="font-dancing gradient-text-rose leading-tight mb-6" style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}>
              {content.heading2}
            </h2>
          </AnimLine>
          <AnimLine delay={280} from="bottom">
            <p className="font-playfair text-2xl md:text-4xl font-bold text-white mb-5">{celebration.recipientName} ✨</p>
          </AnimLine>
          <AnimLine delay={430} from="bottom">
            <p className="font-cormorant text-xl md:text-2xl italic text-white/65 leading-relaxed max-w-xl mx-auto">
              {content.subline2}
            </p>
          </AnimLine>
          {content.showProposalYes && (
            <AnimLine delay={580} from="scale" className="mt-8">
              {!yesResponse ? (
                <button onClick={handleProposalYes} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-2xl rounded-full shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300">
                  Click here to say YES! 💍
                </button>
              ) : (
                <div className="p-8 bg-pink-950/40 border-4 border-pink-500 rounded-3xl inline-block shadow-lg step-enter">
                  <div className="text-4xl mb-3">💖 SHE/HE SAID YES! 💍</div>
                  <p className="text-xl text-pink-300 font-dancing" style={{ fontFamily: "'Dancing Script', cursive" }}>The most magical moment of our lives! Forever together!</p>
                </div>
              )}
            </AnimLine>
          )}
          {!content.showProposalYes && (
            <AnimLine delay={580} from="scale">
              <button
                onClick={() => { setHeartBeat(true); setTimeout(() => setHeartBeat(false), 1500); confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, colors: content.confettiColors }); }}
                className="mt-10 text-6xl cursor-pointer select-none bg-transparent border-0 outline-none"
                style={{ display: "inline-block", animation: heartBeat ? "bgHeartbeat 0.9s ease" : "none" }}>
                ❤️
              </button>
            </AnimLine>
          )}
        </div>
      </section>

      {/* ══ SCENE 3: The Letter ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg, #0a0815 0%, #120829 50%, #0a0815 100%)" }}>
        <div className="nebula-pink" style={{ width: 600, height: 400, top: "30%", left: "0%" }} />
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase text-purple-400 mb-10">
            ✦ A Letter From The Heart ✦
          </AnimLine>

          <div className="glass-card p-8 md:p-12 text-left relative" style={{ boxShadow: "0 0 60px rgba(168,85,247,0.12)" }}>
            {/* Stationery inner frame + ornament */}
            <div className="absolute inset-3 rounded-2xl pointer-events-none" style={{ border: "1px solid rgba(168,85,247,0.16)" }} />
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 px-4 text-purple-300/80 text-lg tracking-[0.5em]" style={{ background: "transparent" }}>✦</div>
            <div className="relative">
            <div className="font-dancing text-4xl text-pink-300 mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
              {content.letterSalutation}
            </div>
            <div className="space-y-5">
              {messageLines.length > 0 ? (
                messageLines.map((line, i) => (
                  <AnimLine key={i} delay={i * 100} from="bottom">
                    <p className="font-cormorant text-lg md:text-xl leading-relaxed text-white/85">
                      {line}
                    </p>
                  </AnimLine>
                ))
              ) : (
                <AnimLine>
                  <p className="font-cormorant text-xl leading-relaxed text-white/80 italic">
                    You are someone truly extraordinary. Every day you make the world a brighter, kinder, more beautiful place just by being in it. On this special day, I want you to know how deeply cherished you are — not just today, but always.
                  </p>
                </AnimLine>
              )}
            </div>
            <AnimLine delay={messageLines.length * 100 + 100} from="right">
              <p className="font-dancing text-3xl text-pink-300 text-right mt-8" style={{ fontFamily: "'Dancing Script', cursive" }}>
                {content.letterSignoff}
              </p>
            </AnimLine>
            </div>
          </div>
          {/* Voice Message Player */}
          {celebration.voiceMessageUrl && (
            <VoiceMessagePlayer url={celebration.voiceMessageUrl} accentColor="#a855f7" isDark={true} />
          )}
          {celebration.videoMessageUrl && (
            <VideoMessagePlayer url={celebration.videoMessageUrl} accentColor="#a855f7" isDark={true} />
          )}
        </div>
      </section>

      {/* ══ SCENE 4: Photo Gallery ════════════════════════════════════════ */}
      {celebration.photos?.length > 0 && (
        <section className="relative overflow-hidden px-6 py-28"
          style={{ background: "linear-gradient(180deg, #0d0920 0%, #0a0815 100%)" }}>
          <Stars />
          <div className="nebula-purple" style={{ width: 400, height: 400, top: "5%", right: "5%" }} />
          <div className="relative z-10">
            <div className="text-center mb-20">
              <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase text-purple-400 mb-4">
                ✦ Captured Moments ✦
              </AnimLine>
              <AnimLine delay={100}>
                <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white">Stories Worth Telling</h2>
              </AnimLine>
              <AnimLine delay={200}>
                <p className="font-cormorant text-lg italic text-white/50 mt-3">Every photo holds a piece of something beautiful.</p>
              </AnimLine>
            </div>
            <div className="flex flex-col gap-24 md:gap-32">
              {celebration.photos.map((url: string, i: number) => {
                const occasionType = celebration.occasionType || "birthday";
                const caps = PHOTO_CAPTIONS_BY_OCCASION[occasionType] || PHOTO_CAPTIONS_BY_OCCASION.birthday;
                return <PhotoCard key={i} url={url} caption={caps[i % caps.length]} index={i} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ SCENE 5: Why You're Special ══════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "radial-gradient(ellipse at center, #1a0a30 0%, #0a0815 70%)" }}>
        <Stars />
        <div className="nebula-pink" style={{ width: 500, height: 500, bottom: "5%", left: "5%" }} />
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase text-purple-400 mb-10">
            ✦ What Makes You You ✦
          </AnimLine>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialItems.map((item, i) => (
              <SpecialCard key={i} emoji={item.emoji} text={item.text} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ SCENE 6: Grand Finale ═════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg, #0a0815 0%, #0f0620 50%, #0a0815 100%)" }}>
        <Stars />
        <div className="nebula-purple" style={{ width: 600, height: 600, top: "0%", left: "20%", opacity: 0.8 }} />
        <div className="nebula-pink" style={{ width: 400, height: 400, bottom: "0%", right: "10%" }} />

        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine from="scale"><div className="text-7xl mb-8">{content.heroEmoji}</div></AnimLine>
          <AnimLine delay={100} className="font-cormorant text-lg text-purple-300/70 tracking-widest uppercase mb-5">
            On this beautiful day
          </AnimLine>
          <AnimLine delay={220} from="scale">
            <h2 className="font-dancing gradient-text-gold leading-tight mb-6" style={{ fontSize: "clamp(2.8rem, 8vw, 5rem)" }}>
              Happy Day,<br />{firstName}! 🌌
            </h2>
          </AnimLine>

          <GlowDivider />

          <AnimLine delay={400} from="bottom">
            <p className="font-cormorant text-xl md:text-2xl italic text-white/70 leading-relaxed mb-10">
              May every wish you make today come true.<br />
              May this year be the most beautiful chapter of your life.<br />
              You deserve nothing less than everything wonderful. 💫
            </p>
          </AnimLine>

          <div className="flex justify-center mb-10">
            <FinaleConfetti />
          </div>

          <AnimLine delay={600} className="font-cormorant text-sm text-purple-400/50 tracking-widest">
            This website was made just for you — keep it forever. 🌙
          </AnimLine>
          <AnimLine delay={700} className="font-cormorant text-sm text-purple-400/35 mt-2">
            Made with ❤️ on{" "}
            <a href="https://just4you.in" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">Just4You</a>
          </AnimLine>
          {typeof celebration.views === "number" && (
            <AnimLine delay={800}>
              <ViewCounter views={celebration.views} accentColor="#a855f7" isDark={true} />
            </AnimLine>
          )}
        </div>
      </section>

      {/* ══ REACTION WALL ════════════════════════════════════════════════════ */}
      {celebration.id && (
        <ReactionWall celebrationId={celebration.id} accentColor="#a855f7" isDark={true} />
      )}

      <MusicPlayer celebration={celebration} />
      <ShareBar name={celebration.recipientName} />
      {celebration.id && (
        <StoryCardModal celebration={celebration} slug={celebration.id} />
      )}
    </main>
  );
}
