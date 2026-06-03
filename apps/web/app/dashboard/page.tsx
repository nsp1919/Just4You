"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { COLLECTIONS, OCCASIONS, OccasionType } from "@/lib/constants";
import { Plus, ExternalLink, Copy, Share2, Eye, Clock, CheckCircle, XCircle, LogOut, User, BarChart3, CreditCard, Flame } from "lucide-react";

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

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      {/* Navbar */}
      <nav className="border-b border-purple-500/10 px-6 py-4"
        style={{ background: "rgba(10,6,18,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-bold gradient-text">Just4You</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-sm">
                {user.displayName?.[0] ?? user.email?.[0] ?? "U"}
              </div>
              <span className="hidden sm:inline">{user.displayName ?? user.email}</span>
            </div>
            <button onClick={logout} className="btn-ghost py-2 px-4 text-sm">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Websites", value: celebrations.length, icon: "🌐", color: "#a855f7" },
            { label: "Active", value: activeCelebrations.length, icon: "✅", color: "#22c55e" },
            { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁️", color: "#f59e0b" },
            { label: "🔥 Trending", value: celebrations.filter((c) => (c.views ?? 0) >= 50).length, icon: "🔥", color: "#f43f5e" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-playfair">
            My <span className="gradient-text">Just4You Websites</span>
          </h1>
          <Link href="/dashboard/create" id="create-new-btn" className="btn-primary py-2 px-5 text-sm">
            <Plus size={16} /> Create New
          </Link>
        </div>

        {/* Celebrations */}
        {fetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                <div className="h-3 bg-white/10 rounded mb-2 w-1/2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : celebrations.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-semibold mb-2">No websites yet</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Create your first website and make someone feel special!
            </p>
            <Link href="/dashboard/create" className="btn-primary">
              <Plus size={16} /> Create Your First Website
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {celebrations.map((c) => {
              const expired = isExpired(c.expiresAt);
              const url = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${c.slug}`;
              const occasion = OCCASIONS.find((o) => o.id === c.occasionType) ?? OCCASIONS[0];
              const displayDate = c.eventDate || c.birthdayDate;
              return (
                <div key={c.id} className="glass-card p-6 hover:border-purple-500/30 transition-all duration-300 group">
                  {/* Photo preview or placeholder */}
                  {c.photos?.[0] ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-4">
                      <img src={c.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-xl flex items-center justify-center mb-4 text-4xl"
                      style={{ background: "rgba(168,85,247,0.1)" }}>{occasion.emoji}</div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{c.recipientName}'s {occasion.label}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{displayDate}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      !c.isActive ? "text-yellow-400" : expired ? "text-red-400" : "text-green-400"
                    }`}
                      style={{
                        background: !c.isActive ? "rgba(245,158,11,0.1)" : expired ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      }}>
                      {!c.isActive ? <Clock size={11} /> : expired ? <XCircle size={11} /> : <CheckCircle size={11} />}
                      {!c.isActive ? "Pending" : expired ? "Expired" : "Active"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-4">
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span style={{ color: (c.views ?? 0) >= 50 ? "#f43f5e" : undefined }}>
                        {(c.views ?? 0).toLocaleString()} views
                      </span>
                      {(c.views ?? 0) >= 50 && <Flame size={11} className="text-orange-400" />}
                    </div>
                    <div className="capitalize">{c.theme} theme</div>
                    <div>{c.photos?.length ?? 0} photos</div>
                  </div>

                  {c.isActive && c.slug && (
                    <div className="flex gap-2">
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
                        <ExternalLink size={12} /> View
                      </a>
                      <button
                        onClick={() => copyLink(c.slug)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all glass"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                        {copied === c.slug ? <><CheckCircle size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                      </button>
                      <button
                        onClick={() => shareWhatsApp(c.slug, c.recipientName, c.occasionType)}
                        className="flex items-center justify-center p-2 rounded-xl transition-all"
                        style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}>
                        <Share2 size={14} />
                      </button>
                    </div>
                  )}
                  {!c.isActive && (
                    <div className="text-xs text-center py-2">
                      <Link
                        href={`/dashboard/pay/${c.id}`}
                        className="btn-primary py-2 px-6 text-xs w-full justify-center"
                      >
                        <CreditCard size={13} /> Complete Payment — ₹299
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
