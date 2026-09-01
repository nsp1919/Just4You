"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Share2, Copy, Check, Volume2, VolumeX, ChevronDown } from "lucide-react";
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
  const init: Record<string, string> = { bottom:"translateY(40px)", left:"translateX(-50px)", right:"translateX(50px)", scale:"scale(0.9)" };
  return (
    <div ref={ref as any} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : init[from], transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`, ...style }}>
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
      <Tilt3D className="flex-shrink-0 w-full md:w-64" direction={isLeft ? 1 : -1} intensity={0.6}>
        <div className="h-64 md:h-72 overflow-hidden relative group" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <img src={url} alt={caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(245,245,245,0.6) 0%, transparent 50%)" }} />
        </div>
      </Tilt3D>
      <Parallax className={`flex-1 ${isLeft ? "text-left" : "text-left md:text-right"}`} distance={30}>
        <div className="text-5xl mb-3 leading-none" style={{ fontFamily: "Georgia, serif", color: "#bbb" }}>"</div>
        <p className="text-xl md:text-2xl leading-relaxed" style={{ fontFamily: "'Lora', Georgia, serif", color: "#333", fontStyle: "italic" }}>
          {caption}
        </p>
        <div className="mt-5 w-12 h-px" style={{ background: "#333", marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0 }} />
      </Parallax>
    </div>
  );
}

const MIN_CAPTIONS = [
  "Some moments are best kept simple — like this one.",
  "The quietest memories are often the most powerful.",
  "This. Right here. This is enough.",
  "Beauty doesn't need a filter.",
  "A moment worth remembering needs no explanation.",
  "There is grace in the simple things.",
  "Everything you need is already here.",
  "Presence is the rarest gift of all.",
];

function SpecialCard({ emoji, text, index }: { emoji: string; text: string; index: number }) {
  return (
    <Reveal3D index={index} originX="left" className="flex items-start gap-4 p-5 text-left border-l-2 transition-all"
      style={{ borderColor: "#e0e0e0" }}>
      <span className="text-xl flex-shrink-0 mt-1">{emoji}</span>
      <p className="text-lg leading-relaxed" style={{ fontFamily: "'Lora', Georgia, serif", color: "#444" }}>{text}</p>
    </Reveal3D>
  );
}

function FinaleConfetti() {
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (inView) setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#333","#888","#ccc","#000","#fff"] }), 400);
  }, [inView]);
  return (
    <div ref={ref as any} style={{ opacity: inView ? 1 : 0, transition: "opacity 1.2s ease", fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", color: "#555", fontStyle: "italic" }}>
      Made with love
    </div>
  );
}

function MusicPlayer({ celebration }: { celebration: Celebration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const url = celebration.musicType === "upload" ? celebration.musicUploadUrl : celebration.musicType === "preset" && celebration.musicPresetId ? `/music/${celebration.musicPresetId}.mp3` : null;
  if (!url) return null;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? (a.pause(), setPlaying(false)) : (a.play().catch(() => {}), setPlaying(true)); };
  return (<><audio ref={audioRef} src={url} loop data-background-music onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><button onClick={toggle} className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "#f5f5f5", border: "1px solid #ddd" }}>{playing ? <Volume2 size={18} color="#333" /> : <VolumeX size={18} color="#333" />}</button></>);
}

function ShareBar({ name, celebrationHeading }: { name: string; celebrationHeading: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🤍 ${celebrationHeading}, ${name} 🤍\n${url}`)}`, "_blank")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow transition-all hover:scale-105" style={{ background: "#25d366" }}><Share2 size={13} /> WhatsApp</button>
      <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow transition-all hover:scale-105" style={{ background: "white", border: "1px solid #ddd", color: "#333" }}>
        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

// Subtle floating dots
function FloatingDots() {
  const [dots, setDots] = useState<{ id: number; x: number; delay: number; dur: number }[]>([]);
  useEffect(() => {
    setDots(Array.from({ length: 15 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 10, dur: Math.random() * 8 + 6 })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {dots.map(d => (
        <div key={d.id} className="absolute rounded-full" style={{ left: `${d.x}%`, bottom: "-2%", width: 4, height: 4, background: "#ccc", opacity: 0.5, animation: `minFloat ${d.dur}s linear ${d.delay}s infinite` }} />
      ))}
    </div>
  );
}

const MIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&display=swap');
  @keyframes minFloat { 0%{transform:translateY(0);opacity:0} 10%{opacity:0.5} 90%{opacity:0.2} 100%{transform:translateY(-100vh);opacity:0} }
  @keyframes minFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  .font-lora { font-family:'Lora',Georgia,serif; }
  .font-cormorant { font-family:'Cormorant Garamond',Georgia,serif; }
`;

import { getOccasionContent } from "../../lib/occasionContent";

export default function MinimalTheme({ celebration }: { celebration: any }) {
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
    setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 }, colors: content.confettiColors }), 1200);
  }, [content.confettiColors]);

  return (
    <main style={{ background: "#fafafa", color: "#111", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: MIN_CSS }} />
      <FloatingDots />

      {/* ── Scene 1: Opening */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6"
        style={{ background: "#fafafa" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center,rgba(0,0,0,0.03) 0%,transparent 70%)" }} />
        <Hero3D className="relative z-10 max-w-3xl">
          <div className="text-5xl mb-6" style={{ animation: "minFloat2 4s ease-in-out infinite" }}>{content.heroEmoji}</div>
          <p className="font-cormorant text-lg tracking-[0.4em] uppercase mb-5" style={{ color: "#aaa" }}>{content.heroSubtitle}</p>
          <h1 className="font-lora font-semibold mb-7 leading-tight" style={{ fontSize: "clamp(3rem,10vw,6.5rem)", color: "#111" }}>
            {celebration.recipientName}
          </h1>
          <div className="flex items-center justify-center gap-5 mb-7">
            <div className="h-px w-24" style={{ background: "#ddd" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#999" }} />
            <div className="h-px w-24" style={{ background: "#ddd" }} />
          </div>
          <p className="font-cormorant text-xl italic leading-relaxed" style={{ color: "#777" }}>
            Some people make the world more beautiful simply by existing.
          </p>
        </Hero3D>
        <button onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 transition-colors" style={{ color: "#ccc", animation: "minFloat2 2.5s ease-in-out infinite" }}>
          <span className="font-cormorant text-sm tracking-widest" style={{ color: "#bbb" }}>scroll</span><ChevronDown size={18} />
        </button>
      </section>

      {/* ── Scene 2: Happy Birthday */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20"
        style={{ background: "#f0f0f0" }}>
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-cormorant text-lg tracking-[0.4em] uppercase mb-5" style={{ color: "#aaa" }}>today is a special day</AnimLine>
          <AnimLine delay={120} from="scale">
            <h2 className="font-lora font-semibold leading-tight mb-5" style={{ fontSize: "clamp(2.5rem,8vw,5.5rem)", color: "#111" }}>
              {content.heading2}
            </h2>
          </AnimLine>
          <AnimLine delay={280}>
            <p className="font-cormorant text-2xl md:text-4xl mb-5" style={{ color: "#555" }}>{celebration.recipientName}</p>
          </AnimLine>
          <AnimLine delay={430}>
            <p className="font-lora text-lg italic leading-relaxed max-w-xl mx-auto" style={{ color: "#777" }}>
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
                <div className="p-8 bg-white border-4 border-pink-400 rounded-3xl inline-block shadow-lg step-enter">
                  <div className="text-4xl mb-3 text-pink-600 font-bold">💖 SHE/HE SAID YES! 💍</div>
                  <p className="text-xl text-pink-500 font-lora">The most magical moment of our lives! Forever together!</p>
                </div>
              )}
            </AnimLine>
          )}
          {!content.showProposalYes && (
            <AnimLine delay={580} from="scale">
              <button className="mt-10 text-4xl bg-transparent border-0 cursor-pointer" onClick={() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, colors: content.confettiColors })}>🤍</button>
            </AnimLine>
          )}
        </div>
      </section>

      {/* ── Scene 3: The Letter */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "#fafafa" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase mb-10" style={{ color: "#bbb" }}>— a letter —</AnimLine>
          <div className="p-8 md:p-12 text-left" style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 2, boxShadow: "0 4px 40px rgba(0,0,0,0.06)" }}>
            <div className="font-lora text-3xl italic mb-6" style={{ color: "#333" }}>{content.letterSalutation}</div>
            <div className="space-y-5">
              {messageLines.length > 0 ? messageLines.map((line, i) => (
                <AnimLine key={i} delay={i * 100}>
                  <p className="font-lora text-lg md:text-xl leading-relaxed" style={{ color: "#444" }}>{line}</p>
                </AnimLine>
              )) : (
                <AnimLine><p className="font-lora text-xl italic leading-relaxed" style={{ color: "#444" }}>You carry the most beautiful light inside you — one that brightens every room, every heart, every moment. On this precious day, I want you to know: you are deeply, endlessly loved.</p></AnimLine>
              )}
            </div>
            <AnimLine delay={messageLines.length * 100 + 100} from="right">
              <p className="font-lora text-2xl italic text-right mt-8" style={{ color: "#888" }}>{content.letterSignoff}</p>
            </AnimLine>
          </div>
          {celebration.voiceMessageUrl && (
            <VoiceMessagePlayer url={celebration.voiceMessageUrl} accentColor="#222" isDark={false} label="A personal voice message for you 🎤" />
          )}
          {celebration.videoMessageUrl && (
            <VideoMessagePlayer url={celebration.videoMessageUrl} accentColor="#222" isDark={false} label="A personal video message for you 🎥" />
          )}
        </div>
      </section>

      {/* ── Scene 4: Photos */}
      {celebration.photos?.length > 0 && (
        <section className="relative overflow-hidden px-6 py-28" style={{ background: "#f0f0f0" }}>
          <div className="relative z-10">
            <div className="text-center mb-20">
              <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase mb-4" style={{ color: "#bbb" }}>— moments —</AnimLine>
              <AnimLine delay={100}><h2 className="font-lora text-3xl md:text-5xl font-semibold" style={{ color: "#111" }}>Worth Keeping</h2></AnimLine>
              <AnimLine delay={200}><p className="font-cormorant text-lg italic mt-3" style={{ color: "#888" }}>Some things don't need words.</p></AnimLine>
            </div>
            <div className="flex flex-col gap-24 md:gap-32">
              {celebration.photos.map((url: string, i: number) => {
                const occasionType = celebration.occasionType || "birthday";
                const birthdayCaptions = [
                  "The quietest memories are often the most powerful.",
                  "Some moments don't need a caption. But this one deserves one.",
                  "There is grace in the simple joy of being together.",
                  "This. Right here. This is enough to make me smile forever.",
                  "A moment worth remembering needs no filter.",
                  "Beauty doesn't need explanation — it just is.",
                  "Everything I needed to remember — it's already here.",
                  "Presence is the rarest gift. You gave it beautifully.",
                ];
                const anniversaryCaptions = [
                  "Love doesn't shout. It stays — quietly, faithfully, always.",
                  "Years pass. This feeling only grows stronger.",
                  "The best decisions are the ones you never regret. You were mine.",
                  "Side by side, frame by frame — our story in full.",
                  "Not a grand gesture — just two people, endlessly choosing each other.",
                  "Simple days with you are the ones I'd relive a thousand times.",
                  "A life well-lived looks exactly like this.",
                  "In every photo, the same truth: I am lucky to have you.",
                ];
                const proposalCaptions = [
                  "The simplest moments hold the heaviest meaning.",
                  "Before this frame, I had a question. After it, I had an answer.",
                  "Everything changed here. And everything is better for it.",
                  "I chose you then. I would choose you in every life.",
                  "No words. Just this — this beautiful, life-changing moment.",
                  "The quietest yes is the loudest thing I've ever heard.",
                  "A memory worth every single moment that led to it.",
                  "You are the reason I believe in forever.",
                ];
                const kidsCaptions = [
                  "Childhood in its purest, most beautiful form.",
                  "A little life, full of the most extraordinary wonder.",
                  "The world through their eyes — endlessly bright and new.",
                  "Some things don't need words. A child's laugh is one of them.",
                  "Growing up is the most breathtaking thing to witness.",
                  "Tiny hands, enormous heart. Always and forever loved.",
                  "This moment, this child — a whole universe in a single frame.",
                  "Here is joy, undiluted and real.",
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
        style={{ background: "#fafafa" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-cormorant text-sm tracking-[0.4em] uppercase mb-10" style={{ color: "#bbb" }}>— what makes you, you —</AnimLine>
          <div className="flex flex-col gap-0 divide-y" style={{ borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
            {specialItems.map((item, i) => <SpecialCard key={i} emoji={item.emoji} text={item.text} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Scene 6: Finale */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 py-24"
        style={{ background: "#111", color: "white" }}>
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine from="scale"><div className="text-6xl mb-8">{content.heroEmoji}</div></AnimLine>
          <AnimLine delay={100} className="font-cormorant text-lg tracking-widest uppercase mb-5" style={{ color: "#555" }}>on this beautiful day</AnimLine>
          <AnimLine delay={220} from="scale">
            <h2 className="font-lora font-semibold leading-tight mb-6" style={{ fontSize: "clamp(2.5rem,8vw,5rem)", color: "white" }}>
              Happy Day,<br />{firstName}.
            </h2>
          </AnimLine>
          <AnimLine delay={380}>
            <p className="font-lora text-xl md:text-2xl italic leading-relaxed mb-10" style={{ color: "#777" }}>
              May every wish you make today come true.<br />
              May this year be the most beautiful chapter of your life. 🤍
            </p>
          </AnimLine>
          <div className="flex justify-center mb-10"><FinaleConfetti /></div>
          <AnimLine delay={600} className="font-cormorant text-sm tracking-widest" style={{ color: "#333" }}>
            made with love on <a href="https://just4you.in" style={{ color: "#888" }} className="hover:text-white transition-colors">Just4You</a>
          </AnimLine>
          {typeof celebration.views === "number" && (
            <AnimLine delay={700}><ViewCounter views={celebration.views} accentColor="#555" isDark={false} /></AnimLine>
          )}
        </div>
      </section>

      {celebration.id && (
        <ReactionWall celebrationId={celebration.id} accentColor="#333" isDark={false} />
      )}

      <MusicPlayer celebration={celebration} />
      <ShareBar name={celebration.recipientName} celebrationHeading={content.heading2.replace(/[!🎂🎈💍💌🎉💑]/g, "").trim()} />
      {celebration.id && (
        <StoryCardModal celebration={celebration} slug={celebration.id} />
      )}
    </main>
  );
}
