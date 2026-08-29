"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, limit, Timestamp, where,
} from "firebase/firestore";

interface Reaction {
  id: string;
  emoji: string;
  name: string;
  message: string;
  createdAt: Timestamp | null;
}

interface Contribution {
  id: string;
  name: string;
  relationship?: string;
  message?: string;
  photoUrl?: string;
  voiceUrl?: string;
  createdAt: Timestamp | null;
}

interface Props {
  celebrationId: string;
  accentColor?: string;
  isDark?: boolean;
}

const EMOJIS = ["❤️", "😍", "🎉", "🥹", "🙌", "💫", "🔥", "🫶"];

const WALL_CSS = `
  @keyframes reactionPop { 0%{transform:scale(0) translateY(20px);opacity:0} 60%{transform:scale(1.1) translateY(-4px)} 100%{transform:scale(1) translateY(0);opacity:1} }
  @keyframes floatHeart { 0%{transform:translateY(0) rotate(-10deg);opacity:1} 100%{transform:translateY(-80px) rotate(10deg);opacity:0} }
  .reaction-item { animation: reactionPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; transition: box-shadow 0.3s ease, border-color 0.3s ease; }
  .reaction-item:hover { box-shadow: 0 14px 36px rgba(0,0,0,0.20); }
  .float-heart { animation: floatHeart 1.2s ease-out forwards; pointer-events:none; }
  .rw-emoji-chip { transition: transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.2s ease, background 0.2s ease; }
`;

function FloatingHeart({ emoji, x }: { emoji: string; x: number }) {
  return (
    <div className="float-heart fixed text-2xl z-[200]" style={{ left: x, bottom: 80 }}>
      {emoji}
    </div>
  );
}

export default function ReactionWall({ celebrationId, accentColor = "#a855f7", isDark = true }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [emoji, setEmoji] = useState("❤️");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // BUG-10: initialise from localStorage lazily so the form never flashes
  // before disappearing for users who already submitted a reaction.
  // The initialiser function runs synchronously before the first render.
  const [submitted, setSubmitted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(`gw_reacted_${celebrationId}`);
  });
  const [floaters, setFloaters] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const floaterIdRef = useRef(0);

  const textColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.75)";
  const mutedColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  useEffect(() => {
    const reactionsQuery = query(
      collection(db, "celebrations", celebrationId, "reactions"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubscribeReactions = onSnapshot(reactionsQuery, (snap) => {
      setReactions(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reaction, "id">) }))
      );
    }, (err) => {
      console.warn("Reaction wall subscription status / permission notice:", err.message);
    });

    const contributionsQuery = query(
      collection(db, "celebrations", celebrationId, "contributions"),
      where("status", "==", "approved"),
      limit(50),
    );
    const unsubscribeContributions = onSnapshot(contributionsQuery, (snap) => {
      const approved = snap.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<Contribution, "id">),
      }));
      approved.sort((left, right) => (left.createdAt?.toMillis?.() ?? 0) - (right.createdAt?.toMillis?.() ?? 0));
      setContributions(approved);
    }, (err) => {
      console.warn("Contribution wall subscription status / permission notice:", err.message);
    });

    return () => {
      unsubscribeReactions();
      unsubscribeContributions();
    };
  }, [celebrationId]);

  const spawnFloater = (em: string) => {
    const id = ++floaterIdRef.current;
    const x = Math.random() * (window.innerWidth - 60) + 30;
    setFloaters((f) => [...f, { id, emoji: em, x }]);
    setTimeout(() => setFloaters((f) => f.filter((fl) => fl.id !== id)), 1300);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "celebrations", celebrationId, "reactions"), {
        emoji,
        name: name.trim().slice(0, 40),
        message: message.trim().slice(0, 100),
        createdAt: serverTimestamp(),
      });
      spawnFloater(emoji);
      setSubmitted(true);
      localStorage.setItem(`gw_reacted_${celebrationId}`, "1");
    } catch (e) {
      console.error("Reaction submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative px-6 py-24 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: WALL_CSS }} />

      {/* Floating hearts */}
      {floaters.map((fl) => <FloatingHeart key={fl.id} emoji={fl.emoji} x={fl.x} />)}

      <div className="max-w-3xl mx-auto">
        {contributions.length > 0 && (
          <div className="mb-24">
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: accentColor }}>✦ Made together ✦</p>
              <h2 className="mb-3 text-3xl font-bold md:text-5xl" style={{ color: textColor, fontFamily: "Playfair Display, serif" }}>Messages from your people</h2>
              <p className="text-base" style={{ color: mutedColor }}>A few memories gathered just for you.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contributions.map((contribution, index) => (
                <article key={contribution.id} className="reaction-item overflow-hidden rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}`, animationDelay: `${index * 60}ms` }}>
                  {contribution.photoUrl && <img src={contribution.photoUrl} alt={`Memory shared by ${contribution.name}`} className="h-52 w-full object-cover" />}
                  <div className="p-5">
                    <div className="mb-3 flex items-baseline gap-2">
                      <strong className="text-sm" style={{ color: textColor }}>{contribution.name}</strong>
                      {contribution.relationship && <span className="text-xs" style={{ color: mutedColor }}>{contribution.relationship}</span>}
                    </div>
                    {contribution.message && <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: textColor }}>{contribution.message}</p>}
                    {contribution.voiceUrl && <audio controls preload="metadata" className="mt-4 h-10 w-full" src={contribution.voiceUrl} />}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="text-center mb-12 relative">
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-6 w-72 h-40 rounded-full"
            style={{ background: `radial-gradient(ellipse at center, ${accentColor}22, transparent 70%)`, filter: "blur(30px)" }} />
          <p className="relative text-xs uppercase tracking-[0.35em] mb-3" style={{ color: accentColor }}>
            ✦ Reactions ✦
          </p>
          <h2 className="relative text-3xl md:text-5xl font-bold mb-3" style={{ color: textColor, fontFamily: "Playfair Display, serif" }}>
            Leave a Reaction 💌
          </h2>
          <p className="relative text-base" style={{ color: mutedColor }}>
            {reactions.length > 0
              ? `${reactions.length} ${reactions.length === 1 ? "person has" : "people have"} reacted 🎉`
              : "Be the first to leave a reaction!"}
          </p>
        </div>

        {/* Input form */}
        {!submitted ? (
          <div
            className="rounded-3xl p-6 md:p-8 mb-12"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: "blur(16px)" }}
          >
            {/* Emoji picker */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3" style={{ color: mutedColor }}>Pick your reaction</p>
              <div className="flex flex-wrap gap-3">
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    onClick={() => setEmoji(em)}
                    className="rw-emoji-chip w-12 h-12 rounded-full text-2xl flex items-center justify-center hover:scale-110 active:scale-95"
                    style={{
                      background: emoji === em ? `${accentColor}30` : cardBg,
                      border: emoji === em ? `2px solid ${accentColor}` : `2px solid ${cardBorder}`,
                      transform: emoji === em ? "scale(1.18)" : "scale(1)",
                      boxShadow: emoji === em ? `0 6px 20px ${accentColor}55` : "none",
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Name + message */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Your name *"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                maxLength={40}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                  border: `1px solid ${cardBorder}`,
                  color: textColor,
                }}
              />
              <textarea
                placeholder="Leave a sweet message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                maxLength={100}
                rows={2}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                  border: `1px solid ${cardBorder}`,
                  color: textColor,
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
              className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #ec4899)` }}
            >
              {submitting ? "Sending..." : `React with ${emoji}`}
            </button>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 mb-12 text-center"
            style={{ background: cardBg, border: `1px solid ${accentColor}40` }}
          >
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-bold text-lg" style={{ color: textColor }}>Your reaction was sent!</p>
            <p className="text-sm mt-1" style={{ color: mutedColor }}>Thank you for spreading the love 💖</p>
          </div>
        )}

        {/* Reactions grid */}
        {reactions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reactions.map((r, idx) => (
              <div
                key={r.id}
                className="reaction-item rounded-2xl p-4 flex items-start gap-3"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: "blur(12px)",
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div className="text-3xl flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", boxShadow: `inset 0 0 0 2px ${accentColor}33` }}>
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: textColor }}>{r.name}</p>
                  {r.message && (
                    <p className="text-sm mt-0.5 leading-relaxed" style={{ color: mutedColor }}>{r.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
