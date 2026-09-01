"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Share2, Copy, Check, Volume2, VolumeX, ChevronDown, Sparkles } from "lucide-react";
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
  occasionType?: any;
  relation?: any;
  relationCustom?: any;
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
    <div ref={ref as any} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : init[from], transition: `opacity 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms, transform 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function PhotoCard({ url, caption, index }: { url: string; caption: string; index: number }) {
  const { ref, inView } = useInView(0.12);
  const isLeft = index % 2 === 0;
  const colors = ["border-rose-400 bg-rose-50", "border-amber-400 bg-amber-50", "border-emerald-400 bg-emerald-50", "border-indigo-400 bg-indigo-50"];
  const borderCol = colors[index % colors.length];

  return (
    <div ref={ref as any} className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-4xl mx-auto w-full px-4"
      style={{ flexDirection: isLeft ? undefined : "row-reverse", opacity: inView ? 1 : 0, transition: `opacity 0.8s ease ${index * 80}ms` }}>
      {/* Polaroid frame */}
      <Tilt3D className="flex-shrink-0 w-full md:w-72" direction={isLeft ? 1 : -1}>
        <div className={`relative polaroid ${index % 2 === 0 ? "rotate-3" : "-rotate-2"} hover:rotate-0 transition-transform duration-300`} style={{ fontFamily: "'Patrick Hand', cursive" }}>
          <span className="washi-tape" />
          <div className={`w-full aspect-square overflow-hidden rounded-md bg-gray-100 border-b-2 ${borderCol.split(" ")[0]}`}>
            <img src={url} alt={caption} className="w-full h-full object-cover" />
          </div>
          <div className="text-center pt-4 text-xl text-gray-700 font-bold font-comic">
            🌈 Slide #{index + 1}
          </div>
        </div>
      </Tilt3D>
      <Parallax className={`flex-1 ${isLeft ? "text-left" : "text-left md:text-right"}`} distance={34}>
        <p className="text-2xl leading-relaxed text-slate-700 font-bold font-comic" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          {caption}
        </p>
      </Parallax>
    </div>
  );
}

function SpecialCard({ emoji, text, index }: { emoji: string; text: string; index: number }) {
  const rotations = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2"];
  const rotation = rotations[index % rotations.length];

  return (
    <Reveal3D index={index}>
      <div className={`flex items-start gap-4 p-5 text-left bg-white border-2 border-amber-200 rounded-2xl shadow-md ${rotation} hover:scale-105 transition-all duration-300`}>
        <span className="text-3xl flex-shrink-0">{emoji}</span>
        <p className="text-xl leading-relaxed text-slate-700 font-semibold" style={{ fontFamily: "'Patrick Hand', cursive" }}>{text}</p>
      </div>
    </Reveal3D>
  );
}

function MusicPlayer({ celebration }: { celebration: Celebration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const url = celebration.musicType === "upload" ? celebration.musicUploadUrl : celebration.musicType === "preset" && celebration.musicPresetId ? `/music/${celebration.musicPresetId}.mp3` : null;
  if (!url) return null;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? (a.pause(), setPlaying(false)) : (a.play().catch(() => {}), setPlaying(true)); };
  return (<><audio ref={audioRef} src={url} loop data-background-music onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /><button onClick={toggle} className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg border-2 border-rose-400 bg-white">{playing ? <Volume2 size={18} className="text-rose-500" /> : <VolumeX size={18} className="text-rose-500" />}</button></>);
}

function ShareBar({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🧸 Happy Kids Birthday, ${name}! Look at this magical website we created for you! 🎈\n${url}`)}`, "_blank")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105" style={{ background: "#25d366" }}><Share2 size={13} /> WhatsApp</button>
      <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all hover:scale-105 bg-white border-2 border-rose-300 text-rose-500">
        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

// Bouncy kids particles (balloons, unicorn, stars, treats)
function KidParticles({ list }: { list: string[] }) {
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; dur: number; sym: string }[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 8,
      dur: Math.random() * 8 + 6, sym: list[Math.floor(Math.random() * list.length)],
    })));
  }, [list]);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <span key={p.id} className="absolute text-3xl select-none" style={{ left: `${p.x}%`, bottom: "-8%", animation: `kidFloat ${p.dur}s linear ${p.delay}s infinite` }}>
          {p.sym}
        </span>
      ))}
    </div>
  );
}

const KIDS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Fredoka+One&display=swap');
  @keyframes kidFloat { 0%{transform:translateY(0) rotate(0deg);opacity:0} 10%{opacity:0.8} 90%{opacity:0.8} 100%{transform:translateY(-105vh) rotate(30deg);opacity:0} }
  @keyframes kidBounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
  .font-comic { font-family: 'Fredoka One', cursive; }
  .font-hand { font-family: 'Patrick Hand', cursive; }
  .kids-gradient-bg { background: linear-gradient(135deg, #fff7ed 0%, #fdf2f8 50%, #ecfdf5 100%); }
  .kids-bubble-card { background: rgba(255,255,255,0.85); border: 3px solid #fecdd3; border-radius: 32px; box-shadow: 0 10px 30px rgba(244,63,94,0.06); }
  .name-aura-magic { position:absolute; inset:-34% -12%; z-index:0; pointer-events:none; background:radial-gradient(ellipse at center, rgba(244,63,94,0.18) 0%, rgba(251,191,36,0.16) 40%, rgba(96,165,250,0.12) 65%, transparent 80%); filter:blur(30px); animation:kidBounce 4s ease-in-out infinite; }
  .polaroid { background:#fff; padding:14px 14px 40px; border-radius:10px; box-shadow:0 16px 40px rgba(80,40,60,0.18), 0 2px 0 rgba(0,0,0,0.03); }
  .washi-tape { position:absolute; top:-11px; left:50%; width:78px; height:24px; transform:translateX(-50%) rotate(-4deg); background:repeating-linear-gradient(45deg,#fda4af 0 7px,#fecdd3 7px 14px); opacity:0.9; border-radius:3px; box-shadow:0 3px 8px rgba(0,0,0,0.12); z-index:3; }
`;

export default function MagicalTheme({ celebration }: { celebration: Celebration }) {
  const [yesResponse, setYesResponse] = useState(false);
  const content = getOccasionContent(
    celebration.occasionType || "kids-birthday",
    celebration.relation || "child",
    celebration.relationCustom || "",
    celebration.recipientName
  );

  const firstName = celebration.recipientName.split(" ")[0];
  const messageLines: string[] = (celebration.message || "").split(/\n+/).filter(Boolean);

  useEffect(() => {
    const triggerConfetti = () => {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.55 }, colors: content.confettiColors });
    };
    const t = setTimeout(triggerConfetti, 1200);
    return () => clearTimeout(t);
  }, [content.confettiColors]);

  const handleProposalYes = () => {
    setYesResponse(true);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ["#ff3366", "#ff66b2", "#ff99cc", "#ffffff"] });
  };

  return (
    <main className="kids-gradient-bg min-h-screen text-slate-800 font-hand relative" style={{ overflowX: "hidden", fontSize: "1.4rem" }}>
      <style dangerouslySetInnerHTML={{ __html: KIDS_CSS }} />
      <KidParticles list={content.particles} />

      {/* ── Scene 1: Welcome Header */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">
        <Hero3D className="relative z-10 max-w-3xl">
          <div className="text-8xl mb-6 inline-block" style={{ animation: "kidBounce 3.5s ease-in-out infinite" }}>
            {content.heroEmoji}
          </div>
          <p className="font-comic text-xl text-rose-500 tracking-wider uppercase mb-3">
            {content.heroSubtitle}
          </p>
          <div className="relative inline-block mb-6">
            <span className="name-aura-magic" />
            <h1 className="font-comic text-rose-500 text-6xl md:text-8xl drop-shadow-md relative">
              {celebration.recipientName}
            </h1>
          </div>
          <p className="text-3xl font-hand text-slate-600 max-w-xl mx-auto italic">
            "Bringing magic, balloons, and candy-colored smiles to your world! 💫"
          </p>
        </Hero3D>
        <button onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-rose-400 hover:text-rose-500 transition-colors z-10" style={{ animation: "kidBounce 2s ease-in-out infinite" }}>
          <span className="font-comic text-sm tracking-widest">SCROLL</span><ChevronDown size={24} />
        </button>
      </section>

      {/* ── Scene 2: Main Event Heading */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 bg-rose-50/50">
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-comic text-lg text-rose-400 tracking-wider uppercase mb-5">Today is a magical day</AnimLine>
          <AnimLine delay={120} from="scale">
            <h2 className="font-comic text-rose-500 text-5xl md:text-7xl mb-6 leading-tight">
              {content.heading2}
            </h2>
          </AnimLine>
          <AnimLine delay={280}>
            <p className="font-comic text-3xl md:text-5xl text-amber-500 mb-6">{celebration.recipientName} ⭐️</p>
          </AnimLine>
          <AnimLine delay={430}>
            <p className="text-2xl leading-relaxed text-slate-600 max-w-lg mx-auto">
              {content.subline2}
            </p>
          </AnimLine>
          {content.showProposalYes && (
            <AnimLine delay={580} from="scale" className="mt-8">
              {!yesResponse ? (
                <button onClick={handleProposalYes} className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-comic text-2xl rounded-full shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300">
                  Click here to say YES! 💍
                </button>
              ) : (
                <div className="p-8 bg-pink-100 border-4 border-pink-400 rounded-3xl inline-block shadow-lg step-enter">
                  <div className="text-5xl mb-3">💖 SHE/HE SAID YES! 💍</div>
                  <p className="text-2xl font-comic text-pink-600">The most magical moment of our lives! Forever together!</p>
                </div>
              )}
            </AnimLine>
          )}
          {!content.showProposalYes && (
            <AnimLine delay={580} from="scale">
              <button className="mt-8 text-5xl bg-transparent border-0 cursor-pointer hover:scale-120 transition-transform active:scale-95" onClick={() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 }, colors: content.confettiColors })}>🎈</button>
            </AnimLine>
          )}
        </div>
      </section>

      {/* ── Scene 3: The Board / Notebook Letter */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 bg-white/40">
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine className="font-comic text-rose-400 text-sm tracking-widest uppercase mb-8">✦ A Letter For You ✦</AnimLine>
          <div className="kids-bubble-card p-8 md:p-12 text-left" style={{ border: "4px solid #fecdd3" }}>
            <div className="font-comic text-3xl text-rose-500 mb-6">{content.letterSalutation}</div>
            <div className="space-y-5">
              {messageLines.length > 0 ? messageLines.map((line, i) => (
                <AnimLine key={i} delay={i * 100}>
                  <p className="text-xl md:text-2xl leading-relaxed text-slate-700">{line}</p>
                </AnimLine>
              )) : (
                <AnimLine><p className="text-2xl leading-relaxed text-slate-700 italic">You are incredibly sweet, smart, and amazing! We are so proud of the joy and happiness you bring to us every single day. Wishing you a year ahead filled with magic, wonders, learning, and endless toys! 🌈🍭</p></AnimLine>
              )}
            </div>
            <AnimLine delay={messageLines.length * 100 + 100} from="right">
              <div className="font-comic text-2xl text-rose-400 text-right mt-8">{content.letterSignoff}</div>
            </AnimLine>
          </div>
          {celebration.voiceMessageUrl && (
            <VoiceMessagePlayer url={celebration.voiceMessageUrl} accentColor="#f43f5e" isDark={false} label="A magical voice message just for you ✨" />
          )}
          {celebration.videoMessageUrl && (
            <VideoMessagePlayer url={celebration.videoMessageUrl} accentColor="#f43f5e" isDark={false} label="A magical video just for you 🎥" />
          )}
        </div>
      </section>

      {/* ── Scene 4: Photos */}
      {celebration.photos?.length > 0 && (
        <section className="relative overflow-hidden px-6 py-28 bg-amber-50/20">
          <div className="relative z-10">
            <div className="text-center mb-20">
              <AnimLine className="font-comic text-sm tracking-wider uppercase text-amber-500 mb-3">✦ Captured Memories ✦</AnimLine>
              <AnimLine delay={100}><h2 className="font-comic text-rose-500 text-4xl md:text-6xl">Stories of Magic</h2></AnimLine>
              <AnimLine delay={200}><p className="text-xl text-slate-500 mt-2">Smiles and sweet moments worth keeping!</p></AnimLine>
            </div>
            <div className="flex flex-col gap-20">
              {celebration.photos.map((url: string, i: number) => {
                const occasionType = celebration.occasionType || "kids-birthday";
                const kidsCaptions = [
                  "Our little superstar shining so bright! 🌟",
                  "Giggles, sparkles, and sweet magical memories! 🦄",
                  "Double the trouble, triple the fun, and infinite love! 🎈",
                  "Growing up too fast, but keeping the wonder forever! 🧸",
                  "The prettiest smile in the whole wide universe! 🍭",
                  "Pure magic, sweet dreams, and cake-colored days! 🍰",
                  "Captured a tiny moment of absolute joy! 💫",
                  "May your world always be filled with wonder and plays! 🎨",
                ];
                const birthdayCaptions = [
                  "Every time I look at this, my heart smiles a little more! 🌈",
                  "In the garden of my memories, you are the absolute brightest bloom! 🌸",
                  "This moment — I want to press it between the pages of forever! 💖",
                  "Some days were made to be remembered exactly like this! ⭐️",
                  "The world is so much more magical because you are in it! 💫",
                  "You carry sunshine wherever you go — this photo is proof! ☀️",
                  "There are moments that words can't hold. This is one of them! ✨",
                  "A photograph of pure joy — captured, kept, and treasured always! 🎁",
                ];
                const anniversaryCaptions = [
                  "Every year with you feels like the best magical chapter yet! 🌟",
                  "A beautiful love like ours deserves to be remembered in every frame! 💕",
                  "This is what two people choosing each other every day looks like! 💫",
                  "The most magical thing I've ever chosen is you, again and again! 💖",
                  "Every petal, every moment — you make everything bloom so beautifully! 🌸",
                  "Our story, captured in light. Still growing, still glowing! ✨",
                  "Time passes, but love like this only deepens with every year! 🌹",
                  "Here's to the memories we've made — and the ones still to come! 🥂",
                ];
                const proposalCaptions = [
                  "The beginning of our forever — right here in this frame! 💍",
                  "Before you, I didn't know what I was looking for. Now I do! 💖",
                  "This moment changed everything — and I'm so grateful it did! ✨",
                  "The answer I've been waiting for — and it was you all along! 💘",
                  "A love story that started here, and has no ending! 💫",
                  "My favorite plot twist: falling hopelessly in love with you! 🌹",
                  "This is the moment I want to remember for the rest of my life! 💕",
                  "You are my greatest adventure, my softest place to land! 🧸",
                ];

                let captionsList = kidsCaptions;
                if (occasionType.includes("birthday") && !occasionType.includes("kids")) {
                  captionsList = birthdayCaptions;
                } else if (occasionType.includes("anniversary")) {
                  captionsList = anniversaryCaptions;
                } else if (occasionType.includes("proposal")) {
                  captionsList = proposalCaptions;
                }

                const caption = captionsList[i % captionsList.length];
                return <PhotoCard key={i} url={url} caption={caption} index={i} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Scene 5: Relationship Virtues */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 bg-teal-50/30">
        <div className="relative z-10 max-w-3xl w-full">
          <AnimLine className="font-comic text-sm tracking-wider uppercase text-rose-400 mb-10">✦ Why You Are Super Awesome ✦</AnimLine>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.specialItems.map((item, i) => (
              <SpecialCard key={i} emoji={item.emoji} text={item.text} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Scene 6: Grand Finale */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-t from-rose-100 to-amber-50">
        <div className="relative z-10 max-w-2xl w-full">
          <AnimLine from="scale"><div className="text-8xl mb-8">🎈🎂🧸</div></AnimLine>
          <AnimLine delay={100} className="font-comic text-xl text-rose-400 tracking-wider mb-4">ON THIS MAGICAL DAY</AnimLine>
          <AnimLine delay={220} from="scale">
            <h2 className="font-comic text-rose-500 text-4xl md:text-6xl mb-6">
              Happy Day,<br />{firstName}! 🌈
            </h2>
          </AnimLine>
          <AnimLine delay={400}>
            <p className="text-2xl leading-relaxed text-slate-700 mb-10">
              May every single one of your magical dreams come true today!<br />
              Keep smiling, keep playing, and keep shining like a little star! ⭐
            </p>
          </AnimLine>
          <AnimLine delay={600} className="text-lg text-rose-400 font-comic opacity-80">
            This magical card was built just for you — visit again whenever you want! 🧸
          </AnimLine>
          <AnimLine delay={700} className="text-sm text-slate-400 mt-4">
            Made with ❤️ on <a href="https://just4you.in" className="text-rose-500 font-bold hover:underline">Just4You</a>
          </AnimLine>
          {typeof celebration.views === "number" && (
            <AnimLine delay={800}><ViewCounter views={celebration.views} accentColor="#f43f5e" isDark={false} /></AnimLine>
          )}
        </div>
      </section>

      {celebration.id && (
        <ReactionWall celebrationId={celebration.id} accentColor="#f43f5e" isDark={false} />
      )}

      <MusicPlayer celebration={celebration} />
      <ShareBar name={celebration.recipientName} />
      {celebration.id && (
        <StoryCardModal celebration={celebration} slug={celebration.id} />
      )}
    </main>
  );
}
