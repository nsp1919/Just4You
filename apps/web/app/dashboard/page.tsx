"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { COLLECTIONS, OCCASIONS, OccasionType, formatInr } from "@/lib/constants";
import { Plus, ExternalLink, Copy, Share2, Eye, Clock, CheckCircle, XCircle, LogOut, User, BarChart3, CreditCard, Flame } from "lucide-react";
import ReferralCard from "@/components/ReferralCard";
import QRCodeCard from "@/components/QRCodeCard";

interface Celebration {
  id: string;
  slug: string;
  recipientName: string;
  birthdayDate: string;
  eventDate?: string;
  theme: string;
  paymentStatus: string;
  isActive: boolean;
  views: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  photos: string[];
  occasionType?: OccasionType;
  relation?: string;
  pricePaise?: number;
}

export default function DashboardPage() {
  const { user, userDoc, logout, loading } = useAuth();
  const router = useRouter();
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]); // BUG-11 fix: router was missing from dependency array

  useEffect(() => {
    if (!user) return;
    const fetchCelebrations = async () => {
      try {
        const q = query(
          collection(db, COLLECTIONS.CELEBRATIONS),
          where("userId", "==", user.uid)
          // Note: orderBy("createdAt") removed — requires composite index.
          // Sorting is handled client-side below instead.
        );
        const snap = await getDocs(q);
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Celebration))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime; // newest first
          });
        setCelebrations(docs);
      } catch (err) {
        console.error("Failed to fetch celebrations:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchCelebrations();
  }, [user]);

  const copyLink = async (slug: string) => {
    const url = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareWhatsApp = (slug: string, name: string, occasionType?: OccasionType) => {
    const url = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`;
    let shareText = `🎂 Happy Birthday ${name}! I made this special birthday website for you!\n\n${url}`;
    if (occasionType === "anniversary") {
      shareText = `💍 Happy Anniversary ${name}! I made this special website to celebrate our love!\n\n${url}`;
    } else if (occasionType === "proposal") {
      shareText = `💌 A Special Surprise for you ${name}! I made this website for you... Please check it out ❤️\n\n${url}`;
    } else if (occasionType === "kids-birthday") {
      shareText = `🧸 Happy Birthday ${name}! Look at this magical website we created for you! 🎈\n\n${url}`;
    }
    const msg = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const isExpired = (expiresAt: Timestamp) => {
    return expiresAt && expiresAt.toDate() < new Date();
  };

  if (loading || !user) return null;

  const activeCelebrations = celebrations.filter((c) => c.isActive && !isExpired(c.expiresAt));
  const totalViews = celebrations.reduce((sum, c) => sum + (c.views || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="min-h-screen relative" style={{ background: "var(--bg-deep)" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-40"
          style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.22), transparent 70%)", filter: "blur(40px)" }}
        />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-purple-500/10 px-6 py-3.5"
        style={{ background: "rgba(10,6,18,0.8)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg"
              style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 6px 18px rgba(168,85,247,0.35)" }}>✨</span>
            <span className="text-xl font-bold gradient-text font-playfair">Just4You</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.18)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
              </div>
              <span className="text-sm text-[var(--text-muted)] max-w-[160px] truncate">{user.displayName ?? user.email}</span>
            </div>
            <button onClick={logout} className="btn-ghost py-2 px-4 text-sm">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 relative">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">
              {greeting}, welcome back 👋
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair">
              {(user.displayName?.split(" ")[0]) ?? "Your"} <span className="gradient-text">Dashboard</span>
            </h1>
          </div>
          <Link href="/pricing" id="create-new-btn" className="btn-primary py-2.5 px-6 self-start sm:self-auto glow-purple">
            <Plus size={17} /> Create New Website
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Websites", value: celebrations.length, icon: "🌐", from: "rgba(168,85,247,0.16)", color: "#c084fc" },
            { label: "Active Now", value: activeCelebrations.length, icon: "✅", from: "rgba(34,197,94,0.16)", color: "#4ade80" },
            { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁️", from: "rgba(245,158,11,0.16)", color: "#fbbf24" },
            { label: "Trending", value: celebrations.filter((c) => (c.views ?? 0) >= 50).length, icon: "🔥", from: "rgba(244,63,94,0.16)", color: "#fb7185" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full" style={{ background: stat.from, filter: "blur(20px)" }} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: stat.from }}>{stat.icon}</div>
                <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Refer & Earn */}
        {user && <ReferralCard uid={user.uid} credits={userDoc?.referralCredits ?? 0} referralCount={(userDoc as any)?.referralCount ?? 0} />}

        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold font-playfair">
            My <span className="gradient-text">Websites</span>
          </h2>
          {celebrations.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
              {celebrations.length}
            </span>
          )}
        </div>

        {/* Celebrations */}
        {fetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-32 bg-white/5 rounded-xl mb-4" />
                <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                <div className="h-3 bg-white/10 rounded mb-2 w-1/2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : celebrations.length === 0 ? (
          <div className="glass-card p-16 text-center relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)", filter: "blur(30px)" }} />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-5"
                style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.15))" }}>✨</div>
              <h2 className="text-2xl font-bold font-playfair mb-2">No websites yet</h2>
              <p className="text-[var(--text-muted)] text-sm mb-7 max-w-sm mx-auto">
                Create your first personalized surprise and make someone feel truly special.
              </p>
              <Link href="/pricing" className="btn-primary glow-purple">
                <Plus size={16} /> Create Your First Website
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {celebrations.map((c) => {
              const expired = isExpired(c.expiresAt);
              const url = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${c.slug}`;
              const occasion = OCCASIONS.find((o) => o.id === c.occasionType) ?? OCCASIONS[0];
              const displayDate = c.eventDate || c.birthdayDate;
              return (
                <div key={c.id} className="glass-card overflow-hidden hover:border-purple-500/40 transition-all duration-300 group hover:-translate-y-1"
                  style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
                  {/* Image header with overlays */}
                  <div className="relative w-full h-40 overflow-hidden">
                    {c.photos?.[0] ? (
                      <img src={c.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.12))" }}>{occasion.emoji}</div>
                    )}
                    {/* gradient scrim */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(18,9,31,0.9) 0%, transparent 55%)" }} />
                    {/* occasion chip */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
                      style={{ background: "rgba(10,6,18,0.55)", color: "#e9d5ff", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <span>{occasion.emoji}</span> {occasion.label}
                    </div>
                    {/* status badge */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md ${
                      !c.isActive ? "text-yellow-300" : expired ? "text-red-300" : "text-green-300"
                    }`}
                      style={{
                        background: !c.isActive ? "rgba(245,158,11,0.22)" : expired ? "rgba(239,68,68,0.22)" : "rgba(34,197,94,0.22)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}>
                      {!c.isActive ? <Clock size={11} /> : expired ? <XCircle size={11} /> : <CheckCircle size={11} />}
                      {!c.isActive ? "Pending" : expired ? "Expired" : "Active"}
                    </div>
                    {/* name overlaid on image bottom */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-bold text-lg leading-tight drop-shadow-md">{c.recipientName}</h3>
                      <p className="text-xs text-white/70 mt-0.5">{displayDate}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-4">
                      <Link href={`/dashboard/analytics/${c.id}`} className="flex items-center gap-1 hover:text-white transition-colors" title="View analytics">
                        <Eye size={12} />
                        <span style={{ color: (c.views ?? 0) >= 50 ? "#fb7185" : undefined }}>
                          {(c.views ?? 0).toLocaleString()}
                        </span>
                        {(c.views ?? 0) >= 50 && <Flame size={11} className="text-orange-400" />}
                      </Link>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <div className="capitalize">{c.theme}</div>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <div>{c.photos?.length ?? 0} photos</div>
                    </div>

                    {c.isActive && c.slug && (
                      <div className="flex gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
                          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
                          <ExternalLink size={12} /> View
                        </a>
                        <button
                          onClick={() => copyLink(c.slug)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all glass hover:brightness-125"
                          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                          {copied === c.slug ? <><CheckCircle size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
                        </button>
                        <button
                          onClick={() => shareWhatsApp(c.slug, c.recipientName, c.occasionType)}
                          className="flex items-center justify-center p-2 rounded-xl transition-all hover:brightness-110"
                          style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}>
                          <Share2 size={14} />
                        </button>
                        <QRCodeCard url={url} name={c.recipientName} compact />
                      </div>
                    )}
                    {!c.isActive && (
                      <Link
                        href={`/dashboard/pay/${c.id}`}
                        className="btn-primary py-2.5 text-xs w-full justify-center"
                      >
                        <CreditCard size={13} /> Complete Payment{c.pricePaise ? ` — ${formatInr(Math.round(c.pricePaise / 100))}` : ""}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
