"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Share2, Copy, Check, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { getOccasionContent } from "../../lib/occasionContent";
import StoryCardModal from "../StoryCardModal";
import ReactionWall from "../ReactionWall";
import VoiceMessagePlayer from "../VoiceMessagePlayer";
import VideoMessagePlayer from "../VideoMessagePlayer";
import ViewCounter from "../ViewCounter";
import { Tilt3D, Parallax, Reveal3D, Hero3D } from "./Scroll3D";
import InvitationActions from "../InvitationActions";

interface Celebration {
  id?: string;
  recipientName: string; birthdayDate: string; message: string;
  photos: string[]; musicType: string; musicPresetId?: string; musicUploadUrl?: string;
  voiceMessageUrl?: string;
  occasionType?: any; relation?: any; relationCustom?: any;
  views?: number;
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimLine({ children, delay = 0, className = "", from = "bottom", style = {} }:
  { children: React.ReactNode; delay?: number; className?: string; from?: "bottom"|"left"|"right"|"scale"; style?: React.CSSProperties }) {
  const { ref, inView } = useInView(0.2);
  const init: Record<string, string> = { bottom:"translateY(40px)", left:"translateX(-50px)", right:"translateX(50px)", scale:"scale(0.88)" };
  return (
    <div ref={ref as any} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : init[from], transition: `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function PhotoCard({ url, caption, index }: { url: string; caption: string; index: number }) {
  const { ref, inView } = useInView(0.12);
  const isLeft = index % 2 === 0;
  return (
    <div ref={ref as any} className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-4xl mx-auto w-full px-4"
      style={{ flexDirection: isLeft ? undefined : "row-reverse", opacity: inView ? 1 : 0, transition: `opacity 1s ease ${index * 80}ms` }}>
      <Tilt3D className="flex-shrink-0 w-full md:w-64" direction={isLeft ? 1 : -1}>
        <div className="film-frame relative group">
          <div className="film-perf mb-3" />
          <div className="h-64 md:h-72 overflow-hidden relative">
            <img src={url} alt={caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "sepia(25%) contrast(1.05) brightness(0.95)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,5,0.6) 0%, transparent 50%)" }} />
            <div className="absolute bottom-2 right-2 text-xs font-mono" style={{ color: "#c9aa7a", opacity: 0.8, fontFamily: "'Special Elite', monospace" }}>
              Memory {index + 1}
            </div>
          </div>
          <div className="film-perf mt-3" />
        </div>
      </Tilt3D>
      <Parallax className={`flex-1 ${isLeft ? "text-left" : "text-left md:text-right"}`} distance={38}>
        <div className="text-5xl mb-3 opacity-40 leading-none" style={{ fontFamily: "'Special Elite', serif", color: "#c9aa7a" }}>"</div>
        <p className="text-xl md:text-2xl leading-relaxed" style={{ fontFamily: "'IM Fell English', Georgia, serif", color: "#e8d5b0", fontStyle: "italic" }}>
          {caption}
        </p>
        <div className="mt-5 w-16 h-0.5" style={{ background: "linear-gradient(to right, #8b5a2b, #c9aa7a)", marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0 }} />
      </Parallax>
    </div>
  );
}

const RETRO_CAPTIONS_BY_OCCASION: Record<string, string[]> = {
  birthday: [
    "Developed in the darkroom of memory, kept forever.",
    "Some negatives are worth printing twice.",
    "Frame this. You'll thank yourself later.",
    "A moment preserved in amber — exactly as beautiful as it was.",
    "Like a Polaroid — this one takes time to truly appreciate.",
    "The grain makes it real. The feeling makes it yours.",
    "Every great roll of film has a moment like this one.",
    "Time moves. Photographs don't. Neither does this love.",
  ],
  anniversary: [
    "Love, developed slowly, printed beautifully.",
    "Two people, one story — still rolling, still beautiful.",
    "Every frame of our life together is worth keeping.",
    "Vintage love: the kind that only gets richer with age.",
    "These are the negatives worth printing for a lifetime.",
    "Aged like a fine print — only more precious with time.",
    "The best love stories have no last page. Ours is proof.",
    "Captured in sepia, felt in full colour. Always.",
  ],
  proposal: [
    "The most important frame of the entire roll.",
    "Before this shot, I had a question. After it, I had my answer.",
    "Some moments are worth stopping the whole world for.",
    "Overexposed with joy — and I wouldn't change a thing.",
    "This negative holds a yes that will last a lifetime.",
    "In every great love story, there is a photograph like this.",
    "Developed in hope. Fixed in love. Kept forever.",
    "The shutter clicked, and everything changed. Forever.",
  ],
  "kids-birthday": [
    "Printed with extra light — for extra joy. 🌟",
    "The cutest subject that ever sat in front of a lens.",
    "A frame full of childhood magic — preserve it always.",
    "Some negatives are worth a thousand words. This is one.",
    "Innocence, captured perfectly, to be kept forever.",
    "Every great collection has a star. Here's ours. ⭐",
    "Overexposed with happiness — exactly as it should be.",
    "The most precious thing ever developed: this child.",
  ],
};

function SpecialCard({ emoji, text, index }: { emoji: string; text: string; index: number }) {
  return (
    <Reveal3D index={index} className="flex items-center gap-4 p-5 text-left transition-all"
      style={{ background: "rgba(201,170,122,0.06)", border: "1px solid rgba(201,170,122,0.2)" }}>
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <p className="text-lg" style={{ fontFamily: "'IM Fell English', Georgia, serif", color: "#e8d5b0", fontStyle: "italic" }}>{text}</p>
    </Reveal3D>
  );
}

function FinaleConfetti() {
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (inView) setTimeout(() => confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ["#c9aa7a","#8b5a2b","#e8d5b0","#d4914f","#fff5e0"] }), 400);
  }, [inView]);
  return (
    <div ref={ref as any} style={{ opacity: inView ? 1 : 0, transition: "opacity 1.2s ease", fontFamily: "'Special Elite', monospace", fontSize: "1.5rem", color: "#c9aa7a", letterSpacing: "0.1em" }}>
      Made with love  ❤
    </div>
  );
}

function MusicPlayer({ celebration }: { celebration: Celebration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const url = celebration.musicType === "upload" ? celebration.musicUploadUrl : celebration.musicType === "preset" && celebration.musicPresetId ? `/music/${celebration.musicPresetId}.mp3` : null;
  if (!url) return null;
  const toggle = () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) void audio.play().catch(() => {}); else audio.pause(); };
  return (<><audio ref={audioRef} src={url} loop data-background-music onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><button onClick={toggle} className="fixed bottom-24 left-6 z-50 w-12 h-12 flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(201,170,122,0.15)", border: "2px solid #8b5a2b", borderRadius: 0 }}>{playing ? <Volume2 size={18} color="#c9aa7a" /> : <VolumeX size={18} color="#c9aa7a" />}</button></>);
}

function ShareBar({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🎞 Happy Birthday, ${name}!\n${url}`)}`, "_blank")} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105" style={{ background: "#25d366", borderRadius: 0 }}><Share2 size={13} /> WhatsApp</button>
      <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:scale-105" style={{ background: "rgba(201,170,122,0.1)", border: "1px solid rgba(201,170,122,0.4)", color: "#c9aa7a", borderRadius: 0 }}>
        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

// Film grain overlay
function FilmGrain() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
      opacity: 0.6,
    }} />
  );
}

// Floating dust particles
function DustParticles() {
  const [dust, setDust] = useState<{ id: number; x: number; delay: number; dur: number }[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDust(Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 12, dur: Math.random() * 10 + 8 }))));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {dust.map(d => (
        <div key={d.id} className="absolute rounded-full" style={{ left: `${d.x}%`, bottom: "-2%", width: 2, height: 2, background: "#c9aa7a", opacity: 0.4, animation: `retroFloat ${d.dur}s linear ${d.delay}s infinite` }} />
      ))}
    </div>
  );
}

// Decorative corner flourish component
function Corner({ pos }: { pos: "tl"|"tr"|"bl"|"br" }) {
  const style: React.CSSProperties = { position: "absolute", width: 30, height: 30, borderColor: "#8b5a2b", borderStyle: "solid", borderWidth: 0 };
  if (pos === "tl") { style.top = 12; style.left = 12; style.borderTopWidth = 2; style.borderLeftWidth = 2; }
  if (pos === "tr") { style.top = 12; style.right = 12; style.borderTopWidth = 2; style.borderRightWidth = 2; }
  if (pos === "bl") { style.bottom = 12; style.left = 12; style.borderBottomWidth = 2; style.borderLeftWidth = 2; }
  if (pos === "br") { style.bottom = 12; style.right = 12; style.borderBottomWidth = 2; style.borderRightWidth = 2; }
  return <div style={style} />;
}

const RETRO_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=IM+Fell+English:ital@0;1&display=swap');
  @keyframes retroFloat { 0%{transform:translateY(0) rotate(0deg);opacity:0} 10%{opacity:0.5} 90%{opacity:0.2} 100%{transform:translateY(-100vh) rotate(10deg);opacity:0} }
  @keyframes retroBob   { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
  .font-special { font-family:'Special Elite',monospace; }
  .font-fell    { font-family:'IM Fell English',Georgia,serif; }
  .sepia-text   { color:#e8d5b0; }
  .gold-text    { color:#c9aa7a; }
  .amber-text   { color:#d4914f; }
  .name-aura-amber { position:absolute; inset:-32% -14%; z-index:0; pointer-events:none; background:radial-gradient(ellipse at center, rgba(212,145,79,0.24) 0%, rgba(201,170,122,0.14) 45%, transparent 72%); filter:blur(34px); animation:retroBob 5.5s ease-in-out infinite; }
  .film-frame { background:#140c05; padding:14px 12px; border:1px solid #3a2512; box-shadow:0 22px 60px rgba(139,90,43,0.3), inset 0 0 0 1px rgba(201,170,122,0.08); }
  .film-perf { height:13px; background-image:repeating-linear-gradient(90deg, #e6d3aa 0 9px, #140c05 9px 21px); border-radius:2px; opacity:0.9; }
`;

export default function RetroTheme({ celebration }: { celebration: any }) {
  const [yesResponse, setYesResponse] = useState(false);
  const content = getOccasionContent(
    celebration.occasionType || "birthday",
    celebration.relation || "friend",
    celebration.relationCustom || "",
    celebration.recipientName
  );

  const firstName = celebration.recipientName.split(" ")[0];
  const messageLines: string[] = (celebration.message || "").split(/\n+/).filter(Boolean);
  const specialItems = content.specialItems;

  const handleProposalYes = () => {
    setYesResponse(true);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ["#ff3366", "#ff66b2", "#ff99cc", "#ffffff"] });
  };

  useEffect(() => {
    setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.55 }, colors: content.confettiColors }), 1200);
  }, [content.confettiColors]);

  return (
    <main style={{ background: "#1a0e05", color: "#e8d5b0", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: RETRO_CSS }} />
      <FilmGrain />
      <DustParticles />

      {/* ── Scene 1: Opening */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6"
        style={{ background: "linear-gradient(180deg,#1a0e05 0%,#2c1a0e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center,rgba(201,170,122,0.08) 0%,transparent 70%)" }} />
        {/* Decorative border frame */}
        <div className="absolute inset-6 pointer-events-none" style={{ border: "1px solid rgba(201,170,122,0.15)" }}>
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
        </div>
        <Hero3D className="relative z-10 max-w-3xl">
          <div className="text-5xl mb-5" style={{ animation: "retroBob 4s ease-in-out infinite" }}>{content.heroEmoji}</div>
          <p className="font-special text-sm tracking-[0.4em] uppercase mb-5 gold-text">{content.heroSubtitle}</p>
          <div className="relative inline-block mb-7">
            <span className="name-aura-amber" />
            <h1 className="font-fell italic leading-tight relative" style={{ fontSize: "clamp(3rem,10vw,6.5rem)", color: "#e8d5b0" }}>
              {celebration.recipientName}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-5 mb-7">
            <div className="h-px w-20" style={{ background: "linear-gradient(to right,transparent,#8b5a2b)" }} />
            <span className="gold-text text-lg">✦</span>
            <div className="h-px w-20" style={{ background: "linear-gradient(to left,transparent,#8b5a2b)" }} />
          </div>
          <p className="font-fell italic text-xl leading-relaxed" style={{ color: "#a07850" }}>
            Some memories are worth developing twice.
          </p>
        </Hero3D>
        <button onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 transition-colors" style={{ color: "#8b5a2b44", animation: "retroBob 2.5s ease-in-out infinite" }}>
          <span className="font-special text-xs tracking-widest gold-text" style={{ opacity: 0.5 }}>scroll</span><ChevronDown size={20} style={{ color: "#8b5a2b" }} />
        </button>
      </section>

      {/* ── Scene 2: Happy Birthday */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20"
        style={{ background: "linear-gradient(180deg,#2c1a0e 0%,#1a0e05 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top,rgba(201,170,122,0.07) 0%,transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-special text-sm tracking-[0.35em] uppercase mb-5 gold-text" style={{ opacity: undefined }}>today is your day</AnimLine>
          <AnimLine delay={120} from="scale">
            <h2 className="font-fell italic leading-tight mb-5" style={{ fontSize: "clamp(2.8rem,9vw,5.5rem)", color: "#e8d5b0" }}>
              {content.heading2}
            </h2>
          </AnimLine>
          <AnimLine delay={280}>
            <p className="font-special text-2xl md:text-3xl mb-5 amber-text">{celebration.recipientName}</p>
          </AnimLine>
          <AnimLine delay={430}>
            <p className="font-fell italic text-xl md:text-2xl leading-relaxed max-w-xl mx-auto" style={{ color: "#a07850" }}>
              {content.subline2}
            </p>
          </AnimLine>
          {content.showProposalYes && (
            <AnimLine delay={580} from="scale" className="mt-8 flex justify-center">
              {!yesResponse ? (
                <button onClick={handleProposalYes} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-2xl rounded-full shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300">
                  Click here to say YES! 💍
                </button>
              ) : (
                <div className="p-8 bg-black/40 border-4 border-pink-400 rounded-3xl inline-block shadow-lg step-enter">
                  <div className="text-4xl mb-3 text-pink-400 font-bold">💖 SHE/HE SAID YES! 💍</div>
                  <p className="text-xl text-pink-300 font-fell italic">The most magical moment of our lives! Forever together!</p>
                </div>
              )}
            </AnimLine>
          )}
          {!content.showProposalYes && (
            <AnimLine delay={580} from="scale">
              <button className="mt-10 text-5xl bg-transparent border-0 cursor-pointer select-none" onClick={() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: content.confettiColors })}>{content.heroEmoji}</button>
            </AnimLine>
          )}
        </div>
      </section>

      {/* ── Scene 3: The Letter */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#1a0e05 0%,#241408 50%,#1a0e05 100%)" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-special text-xs tracking-[0.4em] uppercase mb-10 gold-text" style={{ opacity: undefined }}>— a letter from the heart —</AnimLine>
          <div className="p-8 md:p-12 text-left relative" style={{ background: "rgba(201,170,122,0.04)", border: "1px solid rgba(201,170,122,0.2)" }}>
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
            <div className="font-fell italic text-3xl mb-5 amber-text">{content.letterSalutation}</div>
            <div className="space-y-5">
              {messageLines.length > 0 ? messageLines.map((line, i) => (
                <AnimLine key={i} delay={i * 100}>
                  <p className="font-fell italic text-lg md:text-xl leading-relaxed sepia-text">{line}</p>
                </AnimLine>
              )) : (
                <AnimLine><p className="font-fell italic text-xl leading-relaxed sepia-text">You are the kind of person that history remembers fondly — not for grand gestures, but for the quiet warmth that you bring to everything. On this day, I simply want you to know that you are deeply, profoundly treasured.</p></AnimLine>
              )}
            </div>
            <AnimLine delay={messageLines.length * 100 + 100} from="right">
              <p className="font-fell italic text-2xl text-right mt-8 gold-text">{content.letterSignoff}</p>
            </AnimLine>
          </div>
          {celebration.voiceMessageUrl && (
            <VoiceMessagePlayer url={celebration.voiceMessageUrl} accentColor="#c9a84c" isDark={true} label="A voice note, sealed with love 📜" />
          )}
          {celebration.videoMessageUrl && (
            <VideoMessagePlayer url={celebration.videoMessageUrl} accentColor="#c9a84c" isDark={true} label="A moving picture, just for you 🎞️" />
          )}
        </div>
      </section>

      {/* ── Scene 4: Photos */}
      {celebration.photos?.length > 0 && (
        <section className="relative overflow-hidden px-6 py-28" style={{ background: "linear-gradient(180deg,#241408 0%,#1a0e05 100%)" }}>
          <div className="relative z-10">
            <div className="text-center mb-20">
              <AnimLine className="font-special text-xs tracking-[0.4em] uppercase mb-4 gold-text" style={{ opacity: undefined }}>— the archive —</AnimLine>
              <AnimLine delay={100}><h2 className="font-fell italic text-3xl md:text-5xl sepia-text">Developed With Care</h2></AnimLine>
              <AnimLine delay={200}><p className="font-fell italic text-lg mt-3" style={{ color: "#a07850" }}>Every frame — a piece of something real.</p></AnimLine>
            </div>
            <div className="flex flex-col gap-24 md:gap-32">
              {celebration.photos.map((url: string, i: number) => {
                const occasionType = celebration.occasionType || "birthday";
                const caps = RETRO_CAPTIONS_BY_OCCASION[occasionType] || RETRO_CAPTIONS_BY_OCCASION.birthday;
                return <PhotoCard key={i} url={url} caption={caps[i % caps.length]} index={i} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Scene 5: Why You're Special */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#1a0e05 0%,#2c1a0e 100%)" }}>
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-special text-xs tracking-[0.4em] uppercase mb-10 gold-text" style={{ opacity: undefined }}>— what makes you timeless —</AnimLine>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialItems.map((item, i) => <SpecialCard key={i} emoji={item.emoji} text={item.text} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Scene 6: Finale */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#2c1a0e 0%,#1a0e05 50%,#0d0703 100%)" }}>
        <div className="absolute inset-8 pointer-events-none" style={{ border: "1px solid rgba(201,170,122,0.1)" }}>
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
        </div>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine from="scale"><div className="text-7xl mb-8">{content.heroEmoji}</div></AnimLine>
          <AnimLine delay={100} className="font-special text-xs tracking-[0.35em] uppercase mb-5 gold-text" style={{ opacity: undefined }}>on this golden day</AnimLine>
          <AnimLine delay={220} from="scale">
            <h2 className="font-fell italic leading-tight mb-6 sepia-text" style={{ fontSize: "clamp(2.8rem,8vw,5rem)" }}>
              Happy Day,<br />{firstName}. {content.heroEmoji}
            </h2>
          </AnimLine>
          <AnimLine delay={380}>
            <p className="font-fell italic text-xl md:text-2xl leading-relaxed mb-10" style={{ color: "#a07850" }}>
              May your days ahead be warm and golden,<br />filled with moments worth keeping for always. ✦
            </p>
          </AnimLine>
          <div className="flex justify-center mb-10"><FinaleConfetti /></div>
          <AnimLine delay={600} className="font-special text-xs tracking-[0.3em] uppercase" style={{ color: "#4a2e15" }}>
            made with love · <a href="https://just4you.in" style={{ color: "#8b5a2b" }} className="hover:text-yellow-600 transition-colors">Just4You</a>
          </AnimLine>
          {typeof celebration.views === "number" && (
            <AnimLine delay={700}><ViewCounter views={celebration.views} accentColor="#c9a84c" isDark={true} /></AnimLine>
          )}
        </div>
      </section>

      {celebration.id && (
        <ReactionWall celebrationId={celebration.id} accentColor="#c9a84c" isDark={true} />
      )}

      <InvitationActions celebration={celebration} shareMessage={`🎞 Happy Birthday, ${celebration.recipientName}!`} accentColor="#8b5a2b" square />
    </main>
  );
}
