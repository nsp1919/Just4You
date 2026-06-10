"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Share2, Copy, Check, Volume2, VolumeX, ChevronDown, Sparkles } from "lucide-react";
import { getOccasionContent } from "../../lib/occasionContent";
import StoryCardModal from "../StoryCardModal";
import ReactionWall from "../ReactionWall";
import VoiceMessagePlayer from "../VoiceMessagePlayer";
import ViewCounter from "../ViewCounter";

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
  const init: Record<string, string> = { bottom:"translateY(40px)", left:"translateX(-50px)", right:"translateX(50px)", scale:"scale(0.85)" };
  return (
    <div ref={ref as any} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : init[from], transition: `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function PhotoCard({ url, caption, index, accent }: { url: string; caption: string; index: number; accent: string }) {
  const { ref, inView } = useInView(0.12);
  const isLeft = index % 2 === 0;
  return (
    <div ref={ref as any} className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-4xl mx-auto w-full px-4"
      style={{ flexDirection: isLeft ? undefined : "row-reverse", opacity: inView ? 1 : 0, transform: inView ? "none" : `translateX(${isLeft ? -60 : 60}px)`, transition: `opacity 1s ease ${index * 80}ms, transform 1s ease ${index * 80}ms` }}>
      <div className="flex-shrink-0 w-full md:w-64 h-64 md:h-72 overflow-hidden rounded-3xl relative group"
        style={{ boxShadow: `0 20px 60px ${accent}44, 0 0 0 1px ${accent}33` }}>
        <img src={url} alt={caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
      </div>
      <div className={`flex-1 ${isLeft ? "text-left" : "text-left md:text-right"}`}>
        <div className="text-5xl mb-3 opacity-30" style={{ fontFamily: "serif", lineHeight: 1, color: accent }}>"</div>
        <p className="text-xl md:text-2xl leading-relaxed italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "inherit" }}>
          {caption}
        </p>
        <div className="mt-5 w-12 h-0.5" style={{ background: `linear-gradient(to right, ${accent}, transparent)`, marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0 }} />
      </div>
    </div>
  );
}

const CAPTIONS = [
  "Every petal, every smile — you make everything bloom.",
  "The most beautiful gardens are made of moments like this.",
  "Love is patient, love is kind — and so are you.",
  "In the garden of life, you are the rarest flower.",
  "Where you go, beauty follows.",
  "This memory — I want to press it between the pages of forever.",
  "You bloom wherever you are planted.",
  "Some moments are so perfect, they feel like flowers in the rain.",
];

function SpecialCard({ emoji, text, index, accent }: { emoji: string; text: string; index: number; accent: string }) {
  const { ref, inView } = useInView(0.15);
  return (
    <div ref={ref as any} className="flex items-center gap-4 p-5 rounded-2xl text-left transition-all hover:scale-[1.02]"
      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${accent}22`, opacity: inView ? 1 : 0, transform: inView ? "none" : "scale(0.9) translateY(20px)", transition: `all 0.65s ease ${index * 80}ms` }}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <p className="text-lg" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{text}</p>
    </div>
  );
}

function FinaleConfetti({ colors }: { colors: string[] }) {
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (inView) setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 }, colors }), 400);
  }, [inView]);
  return (
    <div ref={ref as any} style={{ opacity: inView ? 1 : 0, transition: "opacity 1.2s ease", fontFamily: "'Dancing Script', cursive", fontSize: "2rem", color: "#e75480" }}>
      Made with love 💕
    </div>
  );
}

function MusicPlayer({ celebration, accent }: { celebration: Celebration; accent: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const url = celebration.musicType === "upload" ? celebration.musicUploadUrl : celebration.musicType === "preset" && celebration.musicPresetId ? `/music/${celebration.musicPresetId}.mp3` : null;
  if (!url) return null;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? (a.pause(), setPlaying(false)) : (a.play().catch(() => {}), setPlaying(true)); };
  return (<><audio ref={audioRef} src={url} loop /><button onClick={toggle} className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${accent}33`, border: `1px solid ${accent}88`, backdropFilter: "blur(12px)" }}>{playing ? <Volume2 size={18} color={accent} /> : <VolumeX size={18} color={accent} />}</button></>);
}

function ShareBar({ name, accent, celebrationHeading }: { name: string; accent: string; celebrationHeading: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🌸 ${celebrationHeading}, ${name}! 🌸\n${url}`)}`, "_blank")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:scale-105" style={{ background: "#25d366" }}><Share2 size={13} /> WhatsApp</button>
      <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all hover:scale-105" style={{ background: `${accent}18`, border: `1px solid ${accent}44`, color: accent }}>
        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

// Falling petals
function FallingPetals() {
  const [petals, setPetals] = useState<{ id: number; left: number; dur: number; delay: number; sym: string }[]>([]);
  useEffect(() => {
    const syms = ["🌸", "🌺", "🌷", "🌹", "🌼", "✿", "❀"];
    setPetals(Array.from({ length: 18 }, (_, i) => ({ id: i, left: Math.random() * 100, dur: Math.random() * 8 + 8, delay: Math.random() * 12, sym: syms[Math.floor(Math.random() * syms.length)] })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map(p => (
        <span key={p.id} className="absolute select-none" style={{ left: `${p.left}%`, top: "-5%", fontSize: "1.2rem", opacity: 0.6, animation: `floralFall ${p.dur}s linear ${p.delay}s infinite` }}>{p.sym}</span>
      ))}
    </div>
  );
}

const FLORAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=EB+Garamond:ital,wght@0,400;1,400&display=swap');
  @keyframes floralFall { 0%{transform:translateY(-10%) rotate(0deg);opacity:0} 10%{opacity:0.7} 80%{opacity:0.5} 100%{transform:translateY(110vh) rotate(180deg);opacity:0} }
  @keyframes floatPetal { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-14px) rotate(3deg)} }
  @keyframes shimmerRose { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  .font-greatvibes { font-family:'Great Vibes',cursive; }
  .font-garamond   { font-family:'EB Garamond',Georgia,serif; }
  .font-cormorant  { font-family:'Cormorant Garamond',Georgia,serif; }
  .text-rose-grad  { background:linear-gradient(135deg,#c2185b 0%,#e91e63 40%,#880e4f 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmerRose 5s ease infinite; }
  .text-cream-grad { background:linear-gradient(135deg,#fff5f7 0%,#ffd6e0 50%,#c2185b 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .glass-floral    { background:rgba(255,255,255,0.55); border:1px solid rgba(231,84,128,0.2); backdrop-filter:blur(20px); border-radius:24px; }
`;

export default function FloralTheme({ celebration }: { celebration: any }) {
  const [loaded, setLoaded] = useState(false);
  const [yesResponse, setYesResponse] = useState(false);
  const accent = "#c2185b";
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
    setLoaded(true);
    setTimeout(() => confetti({ particleCount: 120, spread: 90, origin: { y: 0.55 }, colors: content.confettiColors }), 1200);
  }, [content.confettiColors]);

  return (
    <main style={{ background: "linear-gradient(160deg,#fff5f8 0%,#ffe8ef 40%,#fff9fb 70%,#ffdde8 100%)", color: "#2d1a2e", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: FLORAL_CSS }} />
      <FallingPetals />


      {/* ── Scene 1: Opening */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6"
        style={{ background: "linear-gradient(180deg,#fff5f8 0%,#ffe0ec 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 20%,rgba(231,84,128,0.12) 0%,transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 80%,rgba(194,24,91,0.08) 0%,transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(50px)", transition: "all 1.3s cubic-bezier(0.16,1,0.3,1) 0.2s" }}>
          <div className="text-6xl mb-5" style={{ animation: "floatPetal 3.5s ease-in-out infinite" }}>{content.heroEmoji}</div>
          <p className="font-cormorant text-lg tracking-[0.35em] uppercase mb-4" style={{ color: "#c2185b88" }}>{content.heroSubtitle}</p>
          <h1 className="font-greatvibes text-rose-grad mb-6 leading-tight" style={{ fontSize: "clamp(3.5rem, 11vw, 7rem)" }}>
            {celebration.recipientName}
          </h1>
          <div className="flex items-center justify-center gap-5 mb-7">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-rose-300" />
            <span className="text-rose-300">🌺</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-pink-300" />
          </div>
          <p className="font-garamond text-xl italic leading-relaxed" style={{ color: "#6d3b57" }}>
            The world bloomed a little more because you are in it.
          </p>
        </div>
        <button onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-colors z-10" style={{ color: "#c2185b77", animation: "floatPetal 2s ease-in-out infinite" }}>
          <span className="font-cormorant text-sm tracking-widest">Scroll</span><ChevronDown size={20} />
        </button>
      </section>

      {/* ── Scene 2: Happy Birthday */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20"
        style={{ background: "linear-gradient(180deg,#ffe8ef 0%,#fff5f8 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top,rgba(231,84,128,0.1) 0%,transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-cormorant text-lg tracking-[0.35em] uppercase mb-5" style={{ color: "#c2185b77" }}>Today is a special day</AnimLine>
          <AnimLine delay={120} from="scale">
            <h2 className="font-greatvibes text-rose-grad leading-tight mb-5" style={{ fontSize: "clamp(3rem,9vw,6rem)" }}>{content.heading2}</h2>
          </AnimLine>
          <AnimLine delay={280}>
            <p className="font-cormorant text-2xl md:text-4xl font-bold mb-5" style={{ color: "#880e4f" }}>{celebration.recipientName} 🌸</p>
          </AnimLine>
          <AnimLine delay={430}>
            <p className="font-garamond text-xl italic leading-relaxed max-w-xl mx-auto" style={{ color: "#6d3b57" }}>
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
                <div className="p-8 bg-pink-100 border-4 border-pink-400 rounded-3xl inline-block shadow-lg step-enter">
                  <div className="text-4xl mb-3">💖 SHE/HE SAID YES! 💍</div>
                  <p className="text-xl text-pink-600 font-greatvibes text-2xl">The most magical moment of our lives! Forever together!</p>
                </div>
              )}
            </AnimLine>
          )}
          {!content.showProposalYes && (
            <AnimLine delay={580} from="scale">
              <button className="mt-10 text-5xl bg-transparent border-0 cursor-pointer select-none" onClick={() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: content.confettiColors })}>🌹</button>
            </AnimLine>
          )}
        </div>
      </section>

      {/* ── Scene 3: The Letter */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#fff5f8 0%,#ffe8ef 50%,#fff5f8 100%)" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase mb-10" style={{ color: "#c2185b88" }}>✿ A Letter From The Heart ✿</AnimLine>
          <div className="glass-floral p-8 md:p-12 text-left shadow-xl">
            <div className="font-greatvibes text-4xl mb-5" style={{ color: "#c2185b" }}>{content.letterSalutation}</div>
            <div className="space-y-5">
              {messageLines.length > 0 ? messageLines.map((line, i) => (
                <AnimLine key={i} delay={i * 100}>
                  <p className="font-garamond text-lg md:text-xl leading-relaxed" style={{ color: "#4a1c30" }}>{line}</p>
                </AnimLine>
              )) : (
                <AnimLine><p className="font-garamond text-xl italic leading-relaxed" style={{ color: "#4a1c30" }}>You carry the most beautiful light inside you — one that brightens every room, every heart, every moment. On this precious day, I want you to know: you are deeply, endlessly loved.</p></AnimLine>
              )}
            </div>
            <AnimLine delay={messageLines.length * 100 + 100} from="right">
              <p className="font-greatvibes text-3xl text-right mt-8" style={{ color: "#c2185b" }}>{content.letterSignoff}</p>
            </AnimLine>
          </div>
          {celebration.voiceMessageUrl && (
            <VoiceMessagePlayer url={celebration.voiceMessageUrl} accentColor="#c2185b" isDark={false} />
          )}
        </div>
      </section>

      {/* ── Scene 4: Photos */}
      {celebration.photos?.length > 0 && (
        <section className="relative overflow-hidden px-6 py-28" style={{ background: "linear-gradient(180deg,#ffe0ec 0%,#fff5f8 100%)" }}>
          <div className="relative z-10">
            <div className="text-center mb-20">
              <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase mb-4" style={{ color: "#c2185b88" }}>✿ Captured Moments ✿</AnimLine>
              <AnimLine delay={100}><h2 className="font-cormorant text-3xl md:text-5xl font-bold" style={{ color: "#880e4f" }}>Stories Worth Telling</h2></AnimLine>
              <AnimLine delay={200}><p className="font-garamond text-lg italic mt-3" style={{ color: "#6d3b57" }}>Every photo holds a petal of something beautiful.</p></AnimLine>
            </div>
            <div className="flex flex-col gap-24 md:gap-32" style={{ color: "#2d1a2e" }}>
              {celebration.photos.map((url: string, i: number) => {
                const occasionType = celebration.occasionType || "birthday";
                const birthdayCaptions = [
                  "Every time I look at this, my heart smiles a little more.",
                  "In the garden of my memories, you are the rarest bloom.",
                  "This moment — I want to press it between the pages of forever.",
                  "Some days were made to be remembered exactly like this.",
                  "The world is more beautiful because you are in it.",
                  "You carry sunshine wherever you go — this photo is proof.",
                  "There are moments that words can't hold. This is one of them.",
                  "A photograph of joy — captured, kept, and treasured always.",
                ];
                const anniversaryCaptions = [
                  "Every year with you feels like the best chapter yet.",
                  "A love like ours deserves to be remembered in every frame.",
                  "This is what two people choosing each other every day looks like.",
                  "The most beautiful thing I've ever chosen — is you, again and again.",
                  "Every petal, every moment — you make everything bloom.",
                  "Our story, captured in light. Still growing, still glowing.",
                  "Time passes, but love like this only deepens with every year.",
                  "Here's to the memories we've made — and the ones still to come.",
                ];
                const proposalCaptions = [
                  "The beginning of our forever — right here in this frame.",
                  "Before you, I didn't know what I was looking for. Now I do.",
                  "This moment changed everything — and I'm so grateful it did.",
                  "The answer I've been waiting for — and it was you all along.",
                  "A love story that started here, and has no ending.",
                  "My favorite plot twist: falling hopelessly in love with you.",
                  "This is the moment I want to remember for the rest of my life.",
                  "You are my greatest adventure, my softest place to land.",
                ];
                const kidsCaptions = [
                  "The most beautiful soul in a tiny, wonderful package. 🌸",
                  "Pure joy, captured in one perfect little human.",
                  "A smile that could light up the entire universe. 🌈",
                  "Childhood is the most magical thing — and you are living it perfectly.",
                  "These little moments are the ones we'll treasure most.",
                  "So small, so mighty, so endlessly loved. 💕",
                  "Every giggle, every adventure — stored here in full bloom.",
                  "Growing up beautifully, one precious day at a time.",
                ];
                const captionMap: Record<string, string[]> = {
                  birthday: birthdayCaptions,
                  anniversary: anniversaryCaptions,
                  proposal: proposalCaptions,
                  "kids-birthday": kidsCaptions,
                };
                const caps = captionMap[occasionType] || birthdayCaptions;
                return <PhotoCard key={i} url={url} caption={caps[i % caps.length]} index={i} accent={accent} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Scene 5: Why You're Special */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#fff5f8 0%,#ffe8ef 100%)" }}>
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase mb-10" style={{ color: "#c2185b88" }}>✿ What Makes You You ✿</AnimLine>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ color: "#2d1a2e" }}>
            {specialItems.map((item, i) => <SpecialCard key={i} emoji={item.emoji} text={item.text} index={i} accent={accent} />)}
          </div>
        </div>
      </section>

      {/* ── Scene 6: Finale */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(180deg,#ffe8ef 0%,#fff5f8 50%,#ffe0ec 100%)" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine from="scale"><div className="text-7xl mb-8">{content.heroEmoji}</div></AnimLine>
          <AnimLine delay={100} className="font-cormorant text-lg tracking-widest uppercase mb-4" style={{ color: "#c2185b77" }}>On this beautiful day</AnimLine>
          <AnimLine delay={220} from="scale">
            <h2 className="font-greatvibes text-rose-grad leading-tight mb-6" style={{ fontSize: "clamp(2.8rem,8vw,5rem)" }}>
              Happy Day,<br />{firstName}! 🌹
            </h2>
          </AnimLine>
          <AnimLine delay={380}>
            <p className="font-garamond text-xl md:text-2xl italic leading-relaxed mb-10" style={{ color: "#6d3b57" }}>
              May this year bring you love in full bloom,<br />joy that never fades, and memories that last forever. 🌷
            </p>
          </AnimLine>
          <div className="flex justify-center mb-10"><FinaleConfetti colors={content.confettiColors} /></div>
          <AnimLine delay={600} className="font-cormorant text-sm tracking-widest" style={{ color: "#c2185b55" }}>Made with ❤️ on <a href="https://just4you.in" className="hover:underline" style={{ color: "#c2185b" }}>Just4You</a></AnimLine>
          {typeof celebration.views === "number" && (
            <AnimLine delay={700}><ViewCounter views={celebration.views} accentColor="#c2185b" isDark={false} /></AnimLine>
          )}
        </div>
      </section>

      {celebration.id && (
        <ReactionWall celebrationId={celebration.id} accentColor="#c2185b" isDark={false} />
      )}

      <MusicPlayer celebration={celebration} accent={accent} />
      <ShareBar name={celebration.recipientName} accent={accent} celebrationHeading={content.heading2.replace(/<[^>]+>/g, "")} />
      {celebration.id && (
        <StoryCardModal celebration={celebration} slug={celebration.id} />
      )}
    </main>
  );
}
