"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { COLLECTIONS, OCCASIONS, OccasionType, formatInr } from "@/lib/constants";
import { Plus, ExternalLink, Copy, Share2, Eye, Clock, CheckCircle, XCircle, LogOut, CreditCard, Flame, ClipboardList, ImagePlus, UsersRound, Clapperboard, Globe2 } from "lucide-react";
import ReferralCard from "@/components/ReferralCard";
import QRCodeCard from "@/components/QRCodeCard";
import ShareAssetGenerator from "@/components/ShareAssetGenerator";

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
  weddingData?: {
    rsvpEnabled?: boolean;
    videoUrl?: string;
  };
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
    } else if (occasionType === "wedding") {
      shareText = `🪔 You're invited to celebrate the wedding of ${name}! Open our interactive invitation for events, directions and RSVP.\n\n${url}`;
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

  // Group websites by their occasion/category type (preserving OCCASIONS order)
  const groupedCelebrations = OCCASIONS
    .map((occ) => ({
      occasion: occ,
      items: celebrations.filter((c) => (c.occasionType ?? "birthday") === occ.id),
    }))
    .filter((g) => g.items.length > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="min-h-screen relative" style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,138,92,0.07), transparent 34rem), var(--bg-deep)" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.07] px-4 py-3 sm:px-6"
        style={{ background: "rgba(21,13,30,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <motion.span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg"
              style={{ background: "linear-gradient(135deg,#ff8a5c,#ff5f93)", boxShadow: "0 6px 18px rgba(255,111,156,0.35)" }}
              whileHover={{ rotate: [0, -12, 12, 0], scale: 1.08 }}
              transition={{ duration: 0.5 }}
            >✨</motion.span>
            <span className="text-lg font-bold text-[#fff5ec] font-playfair">Just4You</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,158,79,0.2)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#ff8a5c,#ff5f93)" }}>
                {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
              </div>
              <span className="text-sm text-[var(--text-muted)] max-w-[160px] truncate">{user.displayName ?? user.email}</span>
            </div>
            <button onClick={logout} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white">
              <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-7 sm:px-6 sm:py-9 relative" style={{ zIndex: 1 }}>
        {/* Welcome header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-7"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1.5">
              {greeting}, {user.displayName?.split(" ")[0] ?? "welcome back"}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-[#fff5ec]">
              Your celebration workspace
            </h1>
          </div>
          <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} className="self-start sm:self-auto">
            <Link href="/pricing" id="create-new-btn" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(255,95,147,0.22)] transition-transform hover:-translate-y-0.5">
              <Plus size={17} /> Create New Website
            </Link>
          </motion.div>
        </motion.div>

        {/* Summary rail */}
        <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.025] mb-6 lg:grid-cols-4" aria-label="Website summary">
          {[
            { label: "Websites", value: celebrations.length, icon: <Globe2 size={17} />, color: "#ff9e4f" },
            { label: "Active", value: activeCelebrations.length, icon: <CheckCircle size={17} />, color: "#4ade80" },
            { label: "Views", value: totalViews, icon: <Eye size={17} />, color: "#ffb877" },
            { label: "Trending", value: celebrations.filter((c) => (c.views ?? 0) >= 50).length, icon: <Flame size={17} />, color: "#fb7185" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.05 }}
              className="flex min-h-20 items-center gap-3 border-white/[0.07] px-4 py-3 even:border-l lg:border-l lg:first:border-l-0"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.045]" style={{ color: stat.color }}>{stat.icon}</span>
              <div>
                <div className="text-xl font-bold leading-none text-[#fff5ec]">{stat.value.toLocaleString()}</div>
                <div className="mt-1.5 text-xs font-medium text-[var(--text-muted)]">{stat.label}</div>
                </div>
            </motion.div>
          ))}
        </section>

        {/* Refer & Earn */}
        {user && (
          <ReferralCard
            uid={user.uid}
            walletBalance={userDoc?.walletBalance ?? userDoc?.referralCredits ?? 0}
            walletWithdrawableBalance={userDoc?.walletWithdrawableBalance}
            referralCount={userDoc?.referralCount ?? 0}
            freeAddonCredits={userDoc?.freeAddonCredits ?? 0}
          />
        )}

        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold font-playfair">
            My <span className="gradient-text">Websites</span>
          </h2>
          {celebrations.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,138,92,0.16)", color: "#ff9e4f" }}>
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
              style={{ background: "radial-gradient(circle, rgba(255,95,147,0.15), transparent 70%)", filter: "blur(30px)" }} />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-5"
                style={{ background: "linear-gradient(135deg, rgba(255,138,92,0.2), rgba(255,95,147,0.15))" }}>✨</div>
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
          <div className="space-y-9">
            {groupedCelebrations.map((group) => (
              <section key={group.occasion.id}>
                {/* Category header */}
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: "rgba(255,138,92,0.14)", border: "1px solid rgba(255,138,92,0.24)" }}>
                    {group.occasion.emoji}
                  </span>
                  <h3 className="text-lg font-bold font-playfair" style={{ color: "#fff5ec" }}>
                    {group.occasion.label}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,138,92,0.16)", color: "#ff9e4f" }}>
                    {group.items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((c, i) => {
              const expired = isExpired(c.expiresAt);
              const url = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${c.slug}`;
              const occasion = OCCASIONS.find((o) => o.id === c.occasionType) ?? OCCASIONS[0];
              const displayDate = c.eventDate || c.birthdayDate;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.5), ease: [0.22, 1, 0.36, 1] }}
                >
                  <article
                    className="glass-card overflow-hidden group h-full hover:border-[rgba(255,158,79,0.32)] transition-colors"
                    style={{ borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}
                  >
                  {/* Image header with overlays */}
                  <div className="relative w-full h-36 overflow-hidden">
                    {c.photos?.[0] ? (
                      <img src={c.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ background: "linear-gradient(135deg, rgba(255,138,92,0.18), rgba(255,95,147,0.12))" }}>{occasion.emoji}</div>
                    )}
                    {/* gradient scrim */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(21,13,30,0.9) 0%, transparent 55%)" }} />
                    {/* occasion chip */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
                      style={{ background: "rgba(21,13,30,0.55)", color: "#ffe6d0", border: "1px solid rgba(255,255,255,0.12)" }}>
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
                      <p className="text-xs text-white/70 mt-0.5">{new Date(`${displayDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-3">
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

                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/collaborate/${c.id}`}
                        className="flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-xs font-semibold text-white/65 transition-colors hover:border-pink-300/25 hover:text-pink-200"
                      >
                        <UsersRound size={14} className="text-pink-300" /> Collect memories
                      </Link>
                      {c.isActive && <Link href={`/dashboard/reactions/${c.id}`} className="flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-xs font-semibold text-white/65 transition-colors hover:border-cyan-300/25 hover:text-cyan-200"><Clapperboard size={14} className="text-cyan-300" /> Reaction reward</Link>}
                      {c.occasionType === "wedding" && c.weddingData?.rsvpEnabled && <Link href={`/dashboard/rsvp/${c.id}`} className="flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-xs font-semibold text-white/65 transition-colors hover:border-emerald-300/25 hover:text-emerald-200"><ClipboardList size={14} className="text-emerald-300" /> Guest RSVPs</Link>}
                      {c.occasionType === "wedding" && c.paymentStatus === "paid" && <Link href={`/dashboard/edit/${c.id}`} className="flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-xs font-semibold text-white/65 transition-colors hover:border-amber-300/25 hover:text-amber-200"><ImagePlus size={14} className="text-amber-300" /> Edit invitation</Link>}
                    </div>

                    {c.isActive && c.slug && (
                      <div className="flex gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                          style={{ background: "rgba(255,138,92,0.15)", border: "1px solid rgba(255,138,92,0.32)", color: "#ff9e4f" }}>
                          <ExternalLink size={12} /> View
                        </a>
                        <button
                          onClick={() => copyLink(c.slug)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all glass hover:brightness-125"
                          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                          {copied === c.slug ? <><CheckCircle size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
                        </button>
                        <button
                          onClick={() => shareWhatsApp(c.slug, c.recipientName, c.occasionType)}
                          className="flex items-center justify-center p-2 rounded-lg transition-all hover:brightness-110"
                          style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.24)", color: "#25d366" }} title="Share on WhatsApp" aria-label={`Share ${c.recipientName}'s website on WhatsApp`}>
                          <Share2 size={14} />
                        </button>
                        <ShareAssetGenerator
                          url={url}
                          recipientName={c.recipientName}
                          eventDate={displayDate}
                          photos={c.photos ?? []}
                          occasionLabel={occasion.label}
                        />
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
                  </article>
                </motion.div>
              );
            })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
