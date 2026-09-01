"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { Copy, Share2, ExternalLink, Check, Heart, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import { getCelebrationUrl } from "@/lib/celebration-url";
import QRCodeCard from "@/components/QRCodeCard";

function SuccessContent() {
  const params = useSearchParams();
  const [slug, setSlug] = useState<string>("");
  const [vanitySlug, setVanitySlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const birthdayUrl = slug ? getCelebrationUrl(slug, vanitySlug) : "";

  // Listen to Firestore celebration doc or read query param slug
  useEffect(() => {
    const querySlug = params.get("slug");
    const queryVanitySlug = params.get("vanity") || "";
    const pendingCelebrationId = typeof window !== "undefined" ? localStorage.getItem("pending_celebration_id") : null;

    if (querySlug) {
      const timer = window.setTimeout(() => {
        setSlug(querySlug);
        setVanitySlug(queryVanitySlug);
        setLoading(false);
        localStorage.removeItem("pending_celebration_id");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (pendingCelebrationId) {
      const docRef = doc(db, COLLECTIONS.CELEBRATIONS, pendingCelebrationId);
      const unsubscribe = onSnapshot(docRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.isActive && data?.slug) {
              setSlug(data.slug);
              setVanitySlug(data.checkoutVanitySlug || "");
              setLoading(false);
              localStorage.removeItem("pending_celebration_id");
            }
          } else {
            setError("Celebration not found.");
            setLoading(false);
          }
        },
        (err) => {
          console.error("Success page real-time listener error:", err);
          setError("Verification in progress. Please check your Dashboard or email in a moment.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      const timer = window.setTimeout(() => {
        setError("No active celebration payment session found.");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [params]);

  // Confetti effect when slug becomes available
  useEffect(() => {
    if (loading || !slug) return;

    const fire = (opts: any) =>
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, ...opts });
    setTimeout(() => {
      fire({ colors: ["#a855f7", "#ec4899", "#f59e0b"] });
      setTimeout(() => fire({ colors: ["#22c55e", "#a855f7", "#ec4899"], angle: 60 }), 400);
      setTimeout(() => fire({ colors: ["#f59e0b", "#ec4899", "#ffffff"], angle: 120 }), 800);
    }, 300);
  }, [loading, slug]);

  const copyLink = async () => {
    if (!birthdayUrl) return;
    await navigator.clipboard.writeText(birthdayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!birthdayUrl) return;
    const msg = encodeURIComponent(`🎂 I created a beautiful birthday website!\n\n${birthdayUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center max-w-md">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
          <p className="text-[var(--text-muted)] text-sm">
            We are confirming your payment with Razorpay. This should take just a moment.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-deep)" }}>
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Verification Pending</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="btn-primary w-full justify-center">Go to Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-deep)" }}>
      <div className="max-w-lg mx-auto text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-4xl font-bold font-playfair mb-3 gradient-text">It's Live!</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Your interactive surprise website is ready to be shared! We've also emailed you the link.
        </p>

        <div className="glass-card p-6 mb-6">
          <div className="text-xs text-[var(--text-muted)] mb-2">Your unique surprise website link:</div>
          <div className="text-sm font-mono text-purple-300 break-all mb-4">{birthdayUrl}</div>
          <div className="flex gap-3">
            <a href={birthdayUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm"
              style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc" }}>
              <ExternalLink size={15} /> View Website
            </a>
            <button onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm glass"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              {copied ? <><Check size={15} className="text-green-400" /> Copied!</> : <><Copy size={15} /> Copy Link</>}
            </button>
          </div>
        </div>

        <button onClick={shareWhatsApp}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-white mb-4"
          style={{ background: "#25d366" }}>
          <Share2 size={18} /> Share on WhatsApp 📱
        </button>

        {/* Scannable QR — print it on a card, gift tag or invite */}
        <div className="mb-4">
          <QRCodeCard url={birthdayUrl} />
        </div>

        <Link href="/dashboard" className="btn-ghost w-full justify-center py-3">
          <Heart size={16} /> Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-deep)" }}>
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}

