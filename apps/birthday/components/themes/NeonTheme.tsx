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

interface Celebration {
  id?: string;
  recipientName: string; birthdayDate: string; message: string;
  photos: string[]; musicType: string; musicPresetId?: string; musicUploadUrl?: string;
  voiceMessageUrl?: string;
  videoMessageUrl?: string;
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
  const init: Record<string, string> = { bottom:"translateY(40px)", left:"translateX(-50px)", right:"translateX(50px)", scale:"scale(0.85)" };
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
        <div className="h-64 md:h-72 overflow-hidden rounded-2xl relative group"
          style={{ boxShadow: "0 20px 60px rgba(0,255,245,0.2), 0 0 0 1px rgba(0,255,245,0.15)", border: "1px solid rgba(0,255,245,0.3)" }}>
          <img src={url} alt={caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,5,0.8) 0%, transparent 50%)" }} />
        </div>
      </Tilt3D>
      <Parallax className={`flex-1 ${isLeft ? "text-left" : "text-left md:text-right"}`} distance={38}>
        <div className="text-5xl mb-3 opacity-30" style={{ fontFamily: "monospace", lineHeight: 1, color: "#00fff5" }}>//</div>
        <p className="text-xl md:text-2xl leading-relaxed" style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", color: "#e0e0e0" }}>
          {caption}
        </p>
        <div className="mt-5 w-12 h-0.5" style={{ background: "linear-gradient(to right, #00fff5, #ff00ff)", marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0 }} />
      </Parallax>
    </div>
  );
}

const NEON_CAPTIONS = [
  "// this memory.exe — running forever in my heart",
  "system.log: found something beautiful here",
  "// uploading you to my permanent storage ❤",
  "capture.init() → result: unforgettable",
  "// these moments? cannot be deleted",
  "render(you) → output: extraordinary",
  "// keep this. don't let it fade.",
  "const memory = { value: 'priceless', expires: never }",
];

function SpecialCard({ emoji, text, index }: { emoji: string; text: string; index: number }) {
  return (
    <Reveal3D index={index} className="flex items-center gap-4 p-5 rounded-xl text-left transition-all"
      style={{ background: "rgba(0,255,245,0.04)", border: "1px solid rgba(0,255,245,0.15)" }}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <p className="text-lg" style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", color: "#c0c0c0" }}>{text}</p>
    </Reveal3D>
  );
}

function FinaleConfetti() {
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (inView) setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 }, colors: ["#00fff5","#ff00ff","#ffff00","#ff6600"] }), 400);
  }, [inView]);
  return (
    <div ref={ref as any} style={{ opacity: inView ? 1 : 0, transition: "opacity 1.2s ease", fontFamily: "'Share Tech Mono', monospace", fontSize: "1.4rem", color: "#00fff5", textShadow: "0 0 15px #00fff5" }}>
      // made_with(love) ❤
    </div>
  );
}

function MusicPlayer({ celebration }: { celebration: Celebration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const url = celebration.musicType === "upload" ? celebration.musicUploadUrl : celebration.musicType === "preset" && celebration.musicPresetId ? `/music/${celebration.musicPresetId}.mp3` : null;
  if (!url) return null;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? (a.pause(), setPlaying(false)) : (a.play().catch(() => {}), setPlaying(true)); };
  return (<><audio ref={audioRef} src={url} loop data-background-music onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><button onClick={toggle} className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(0,255,245,0.1)", border: "1px solid rgba(0,255,245,0.5)", boxShadow: "0 0 15px rgba(0,255,245,0.3)" }}>{playing ? <Volume2 size={18} color="#00fff5" /> : <VolumeX size={18} color="#00fff5" />}</button></>);
}

function ShareBar({ name, celebrationHeading }: { name: string; celebrationHeading: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`⚡ ${celebrationHeading.toUpperCase()} ${name.toUpperCase()}! ⚡\n${url}`)}`, "_blank")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all hover:scale-105" style={{ background: "#25d366" }}><Share2 size={13} /> WhatsApp</button>
      <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition-all hover:scale-105" style={{ border: "1px solid rgba(0,255,245,0.4)", color: "#00fff5", boxShadow: "0 0 10px rgba(0,255,245,0.15)" }}>
        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

// Grid overlay + scan line
function CyberGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,245,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,245,0.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
    </div>
  );
}

// Electric particles
function ElectricParticles() {
  const [sparks, setSparks] = useState<{ id: number; x: number; delay: number; dur: number; color: string }[]>([]);
  useEffect(() => {
    const colors = ["#00fff5", "#ff00ff", "#ffff00", "#ff6600"];
    setSparks(Array.from({ length: 25 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 10, dur: Math.random() * 6 + 4, color: colors[Math.floor(Math.random() * colors.length)] })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {sparks.map(s => (
        <span key={s.id} className="absolute text-xs select-none" style={{ left: `${s.x}%`, bottom: "-5%", color: s.color, opacity: 0.6, textShadow: `0 0 8px ${s.color}`, animation: `neonFloat ${s.dur}s linear ${s.delay}s infinite` }}>✦</span>
      ))}
    </div>
  );
}

const NEON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
  @keyframes neonFloat { 0%{transform:translateY(0);opacity:0} 10%{opacity:0.8} 90%{opacity:0.3} 100%{transform:translateY(-100vh);opacity:0} }
  @keyframes neonFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
  @keyframes glitch { 0%,100%{clip-path:polygon(0 0,100% 0,100% 35%,0 35%);transform:translate(-2px,0)} 50%{clip-path:polygon(0 65%,100% 65%,100% 100%,0 100%);transform:translate(2px,0)} }
  .font-orbitron { font-family:'Orbitron',sans-serif; }
  .font-mono-share { font-family:'Share Tech Mono','Courier New',monospace; }
  .neon-cyan { color:#00fff5; text-shadow:0 0 10px #00fff5,0 0 30px #00fff5,0 0 60px #00fff5; }
  .neon-magenta { color:#ff00ff; text-shadow:0 0 10px #ff00ff,0 0 30px #ff00ff,0 0 60px #ff00ff; }
  .neon-grad { background:linear-gradient(135deg,#00fff5 0%,#ff00ff 50%,#ffff00 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .neon-border { border:1px solid rgba(0,255,245,0.3); box-shadow:0 0 20px rgba(0,255,245,0.1),inset 0 0 20px rgba(0,255,245,0.03); }
`;

export default function NeonTheme({ celebration }: { celebration: any }) {
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
    setTimeout(() => confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, colors: content.confettiColors }), 1200);
  }, [content.confettiColors]);

  return (
    <main style={{ background: "#050505", color: "white", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: NEON_CSS }} />
      <CyberGrid />
      <ElectricParticles />

      {/* ── Scene 1: Opening */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6"
        style={{ background: "radial-gradient(ellipse at center,#0d0a0d 0%,#050505 100%)" }}>
        <div className="absolute" style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse,rgba(0,255,245,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div className="absolute" style={{ bottom: 0, right: "10%", width: 400, height: 300, background: "radial-gradient(ellipse,rgba(255,0,255,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <Hero3D className="relative z-10 max-w-3xl">
          <div className="font-mono-share text-sm tracking-[0.4em] uppercase mb-5" style={{ color: "#ff00ff", textShadow: "0 0 10px #ff00ff" }}>★ CYBERPUNK {celebration.occasionType?.toUpperCase() || "BIRTHDAY"} ★</div>
          <div className="text-6xl mb-5" style={{ animation: "neonFloat2 3s ease-in-out infinite" }}>{content.heroEmoji}</div>
          <h1 className="font-orbitron font-black neon-grad mb-4 leading-tight" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            {content.heroSubtitle.toUpperCase()}
          </h1>
          <div className="font-orbitron font-black mb-7 leading-tight" style={{ fontSize: "clamp(2rem,7vw,4.5rem)", color: "#ff00ff", textShadow: "0 0 20px #ff00ff,0 0 60px #ff00ff" }}>
            {celebration.recipientName.toUpperCase()}! ⚡
          </div>
          <div className="flex items-center justify-center gap-5 mb-7">
            <div className="h-px w-20" style={{ background: "linear-gradient(to right,transparent,#00fff5)" }} />
            <span style={{ color: "#00fff5", textShadow: "0 0 10px #00fff5" }}>◆</span>
            <div className="h-px w-20" style={{ background: "linear-gradient(to left,transparent,#ff00ff)" }} />
          </div>
          <p className="font-mono-share text-lg leading-relaxed" style={{ color: "#888" }}>
            // the world just got a lot more electric because you are here
          </p>
        </Hero3D>
        <button onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 transition-colors" style={{ color: "#00fff544", animation: "neonFloat2 2s ease-in-out infinite" }}>
          <span className="font-mono-share text-xs tracking-widest">SCROLL</span><ChevronDown size={20} />
        </button>
      </section>

      {/* ── Scene 2: Happy Birthday */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20"
        style={{ background: "radial-gradient(ellipse at top,#110011 0%,#050505 70%)" }}>
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-mono-share text-sm tracking-[0.4em] uppercase mb-5" style={{ color: "#00fff577" }}>// today.is_special = true</AnimLine>
          <AnimLine delay={120} from="scale">
            <h2 className="font-orbitron font-black neon-grad leading-tight mb-5" style={{ fontSize: "clamp(2.5rem,8vw,5rem)" }}>
              {content.heading2.toUpperCase()}
            </h2>
          </AnimLine>
          <AnimLine delay={280}>
            <p className="font-orbitron text-xl md:text-3xl font-bold mb-5 neon-cyan">{celebration.recipientName} ⚡</p>
          </AnimLine>
          <AnimLine delay={430}>
            <p className="font-mono-share text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#c0c0c0" }}>
              {content.subline2}
            </p>
          </AnimLine>
          {content.showProposalYes && (
            <AnimLine delay={580} from="scale" className="mt-8">
              {!yesResponse ? (
                <button onClick={handleProposalYes} className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-600 hover:to-fuchsia-600 text-black font-orbitron font-black text-2xl rounded-lg shadow-lg border border-[#00fff5] transform hover:scale-110 active:scale-95 transition-all duration-300">
                  // CLICK TO SAY YES! 💍
                </button>
              ) : (
                <div className="p-8 bg-[#00fff5]/10 border border-[#00fff5] rounded-xl inline-block shadow-lg step-enter">
                  <div className="text-3xl mb-3 text-[#ff00ff] font-orbitron font-black font-bold">// SHE/HE SAID YES! 💍</div>
                  <p className="text-xl text-[#00fff5] font-mono-share">system.log: proposal response verified. lifelong partnership loaded! ❤️</p>
                </div>
              )}
            </AnimLine>
          )}
          {!content.showProposalYes && (
            <AnimLine delay={580} from="scale">
              <button className="mt-10 text-5xl bg-transparent border-0 cursor-pointer select-none" onClick={() => confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: content.confettiColors })}>💜</button>
            </AnimLine>
          )}
        </div>
      </section>

      {/* ── Scene 3: The Letter */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#050505 0%,#080b10 50%,#050505 100%)" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-mono-share text-sm tracking-[0.35em] uppercase mb-10" style={{ color: "#00fff566" }}>// letter.open() ──────────────────</AnimLine>
          <div className="p-8 md:p-12 text-left rounded-2xl neon-border" style={{ background: "rgba(0,255,245,0.03)" }}>
            {/* Corner decorations */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16, borderLeft: "2px solid #00fff5", borderTop: "2px solid #00fff5" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRight: "2px solid #ff00ff", borderTop: "2px solid #ff00ff" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, borderLeft: "2px solid #ff00ff", borderBottom: "2px solid #ff00ff" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRight: "2px solid #00fff5", borderBottom: "2px solid #00fff5" }} />
            <div className="font-mono-share text-2xl mb-5 neon-cyan">$ TO: {content.letterSalutation.toUpperCase().replace(",", "")}</div>
            <div className="space-y-5">
              {messageLines.length > 0 ? messageLines.map((line, i) => (
                <AnimLine key={i} delay={i * 100}>
                  <p className="font-mono-share text-lg leading-relaxed" style={{ color: "#d0d0d0" }}>{`> ${line}`}</p>
                </AnimLine>
              )) : (
                <AnimLine><p className="font-mono-share text-lg leading-relaxed" style={{ color: "#d0d0d0" }}>{`> You carry the most beautiful light inside you — one that brightens every room, every heart, every moment. On this precious day, I want you to know: you are deeply, endlessly loved.`}</p></AnimLine>
              )}
            </div>
            <AnimLine delay={messageLines.length * 100 + 100} from="right">
              <p className="font-mono-share text-xl text-right mt-8 neon-magenta">FROM: {content.letterSignoff.toUpperCase().replace("💕", "❤")}</p>
            </AnimLine>
          </div>
          {celebration.voiceMessageUrl && (
            <VoiceMessagePlayer url={celebration.voiceMessageUrl} accentColor="#00fff5" isDark={true} label="Voice message from your special someone 💌" />
          )}
          {celebration.videoMessageUrl && (
            <VideoMessagePlayer url={celebration.videoMessageUrl} accentColor="#00fff5" isDark={true} label="Video transmission incoming 📹" />
          )}
        </div>
      </section>

      {/* ── Scene 4: Photos */}
      {celebration.photos?.length > 0 && (
        <section className="relative overflow-hidden px-6 py-28" style={{ background: "linear-gradient(180deg,#080b10 0%,#050505 100%)" }}>
          <div className="relative z-10">
            <div className="text-center mb-20">
              <AnimLine className="font-mono-share text-sm tracking-[0.35em] uppercase mb-4" style={{ color: "#ff00ff66" }}>⚡ MEMORIES.EXE ⚡</AnimLine>
              <AnimLine delay={100}><h2 className="font-orbitron text-3xl md:text-5xl font-bold neon-cyan">LOADING MOMENTS</h2></AnimLine>
              <AnimLine delay={200}><p className="font-mono-share text-lg mt-3" style={{ color: "#555" }}>// these files cannot be corrupted</p></AnimLine>
            </div>
            <div className="flex flex-col gap-24 md:gap-32">
              {celebration.photos.map((url: string, i: number) => {
                const occasionType = celebration.occasionType || "birthday";
                const birthdayCaptions = [
                  "// this moment? it's saved permanently. no deletes allowed.",
                  "// error 404: words.cannot_describe(how_special_you_are)",
                  "// timestamp saved. feeling: pure, unfiltered happiness ⚡",
                  "// the best memory in the entire database — right here.",
                  "// this frame holds more than pixels — it holds a feeling.",
                  "// system alert: this smile is dangerously contagious.",
                  "// a moment so real, no filter could ever make it better.",
                  "// debug log: found overwhelming joy in this exact frame.",
                ];
                const anniversaryCaptions = [
                  "// years together, and every frame gets more beautiful.",
                  "// this is what forever looks like — worth every pixel.",
                  "// love.exe is running. no crashes. no shutdowns. ever.",
                  "// two hearts, one story — still writing the best chapters.",
                  "// this moment: proof that choosing each other was right.",
                  "// a memory so warm, it rewrites all the cold days.",
                  "// uploading love — storage: unlimited. expiry: never.",
                  "// the most valuable file in the entire timeline.",
                ];
                const proposalCaptions = [
                  "// the exact moment everything changed. forever.",
                  "// before and after — this is the after. the beautiful after.",
                  "// system update: life just got infinitely better.",
                  "// heart.rate = MAX_VALUE. reason: you.",
                  "// love confirmed. connection: permanent. signal: strong.",
                  "// this frame holds the beginning of our forever.",
                  "// you are the answer to every question I ever had.",
                  "// loading our future together — please do not interrupt.",
                ];
                const kidsCaptions = [
                  "// this tiny human contains infinite amounts of joy. 🎈",
                  "// pure happiness, unfiltered. no edits needed.",
                  "// the cutest bug in the whole system — you! ⭐",
                  "// loading childhood magic — 100% complete!",
                  "// this smile: the best thing our eyes have ever processed.",
                  "// a little person with the biggest heart in the world.",
                  "// error: cuteness overload detected! too adorable to handle.",
                  "// memory of pure innocence, saved forever. 🌈",
                ];
                const captionMap: Record<string, string[]> = {
                  birthday: birthdayCaptions,
                  anniversary: anniversaryCaptions,
                  proposal: proposalCaptions,
                  "kids-birthday": kidsCaptions,
                };
                const caps = captionMap[occasionType] || birthdayCaptions;
                return <PhotoCard key={i} url={url} caption={caps[i % caps.length]} index={i} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Scene 5: Why You're Special */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "radial-gradient(ellipse at center,#0a0015 0%,#050505 70%)" }}>
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-mono-share text-sm tracking-[0.35em] uppercase mb-10" style={{ color: "#00fff566" }}>// reasons_you_are_legendary[]</AnimLine>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialItems.map((item, i) => <SpecialCard key={i} emoji={item.emoji} text={item.text} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Scene 6: Finale */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "radial-gradient(ellipse at center,#0d0510 0%,#050505 70%)" }}>
        <div className="absolute" style={{ top: "10%", left: "20%", width: 600, height: 600, background: "radial-gradient(circle,rgba(0,255,245,0.07) 0%,transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine from="scale"><div className="text-7xl mb-8">{content.heroEmoji}</div></AnimLine>
          <AnimLine delay={100} className="font-mono-share text-sm tracking-widest uppercase mb-5" style={{ color: "#00fff566" }}>// final_message.exe</AnimLine>
          <AnimLine delay={220} from="scale">
            <h2 className="font-orbitron font-black neon-grad leading-tight mb-6" style={{ fontSize: "clamp(2.5rem,8vw,4.5rem)" }}>
              HAPPY DAY,<br />{firstName.toUpperCase()}! 🌌
            </h2>
          </AnimLine>
          <AnimLine delay={380}>
            <p className="font-mono-share text-lg md:text-xl leading-relaxed mb-10" style={{ color: "#999" }}>
              {"// may every single one of your wishes come true today\n// may this year be your greatest level yet\n// you were always the main character ⚡"}
            </p>
          </AnimLine>
          <div className="flex justify-center mb-10"><FinaleConfetti /></div>
          <AnimLine delay={600} className="font-mono-share text-sm" style={{ color: "#333" }}>
            // powered by <a href="https://just4you.in" style={{ color: "#00fff5" }}>Just4You</a>
          </AnimLine>
          {typeof celebration.views === "number" && (
            <AnimLine delay={700}><ViewCounter views={celebration.views} accentColor="#00fff5" isDark={true} /></AnimLine>
          )}
        </div>
      </section>

      {celebration.id && (
        <ReactionWall celebrationId={celebration.id} accentColor="#00fff5" isDark={true} />
      )}

      <MusicPlayer celebration={celebration} />
      <ShareBar name={celebration.recipientName} celebrationHeading={content.heading2.replace(/[!🎂🎈💍💌🎉💑]/g, "").trim()} />
      {celebration.id && (
        <StoryCardModal celebration={celebration} slug={celebration.id} />
      )}
    </main>
  );
}
