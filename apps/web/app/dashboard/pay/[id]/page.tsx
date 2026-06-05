"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS, PRICE_INR } from "@/lib/constants";
import { ArrowLeft, CreditCard, Camera, Sparkles } from "lucide-react";

// ─── Payment component ────────────────────────────────────────────────────────
function PaymentPanel({ celebrationId, recipientName, theme, photoCount, occasionType, onSuccess }: {
  celebrationId: string;
  recipientName: string;
  theme: string;
  photoCount: number;
  occasionType: string;
  onSuccess: (slug: string) => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const occasion = occasionType || "birthday";
  const occasionEmoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
  const occasionLabel = occasion === "anniversary" ? "Marriage Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      const token = await user!.getIdToken();

      // Create a unique Razorpay Payment Link with celebrationId guaranteed in notes
      const linkRes = await fetch("/api/payment/create-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ celebrationId }),
      });

      if (!linkRes.ok) {
        const err = await linkRes.json().catch(() => ({}));
        setError(err.error ?? "Failed to create payment link. Please try again.");
        setLoading(false);
        return;
      }

      const { paymentUrl } = await linkRes.json();

      // Save celebrationId so payment-return page can poll Firestore
      localStorage.setItem("pending_celebration_id", celebrationId);

      // Redirect to unique payment link — celebrationId is locked in notes
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error("Payment error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 text-center">
      {/* Celebration summary */}
      <div className="mb-8 p-4 rounded-2xl text-left" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <div className="text-xs text-[var(--text-muted)] mb-3 font-medium uppercase tracking-wider">Your Just4You Website</div>
        <div className="font-bold text-lg mb-1">{occasionEmoji} {recipientName}'s {occasionLabel}</div>
        <div className="flex gap-4 text-xs text-[var(--text-muted)] mt-2">
          <span className="flex items-center gap-1"><Sparkles size={11} /> {theme} theme</span>
          <span className="flex items-center gap-1"><Camera size={11} /> {photoCount} photos</span>
        </div>
      </div>

      <div className="text-5xl mb-3">{occasionEmoji}</div>
      <h2 className="text-2xl font-bold font-playfair mb-2">Almost there!</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Pay once to make this website go live.</p>

      <div className="text-6xl font-bold gradient-text mb-1">₹{PRICE_INR}</div>
      <div className="text-xs text-[var(--text-muted)] mb-8">One-time payment • 1 year validity • Instant delivery</div>

      {error && (
        <div className="text-sm text-red-400 p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <button
        id="pay-button"
        onClick={handlePay}
        disabled={loading}
        className="btn-primary w-full justify-center py-4 text-base glow-purple disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <CreditCard size={20} />
        {loading ? "Creating payment link..." : `✨ Unlock My Surprise Website — ₹${PRICE_INR}`}
      </button>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
        <span>🔒 Secured by Razorpay</span>
        <span>📱 UPI, Cards, PhonePe</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PayPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const celebrationId = params.id as string;

  const [celebration, setCelebration] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading]);

  // Load celebration
  useEffect(() => {
    if (!user || !celebrationId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.CELEBRATIONS, celebrationId));
        if (!snap.exists() || snap.data()?.userId !== user.uid) {
          setNotFound(true);
        } else if (snap.data()?.isActive) {
          router.replace("/dashboard");
        } else {
          setCelebration({ id: snap.id, ...snap.data() });
        }
      } catch {
        setNotFound(true);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user, celebrationId]);

  if (authLoading || fetching) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎂</div>
          <div className="text-[var(--text-muted)] text-sm">Loading your celebration...</div>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-deep)" }}>
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Celebration not found</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">This may have been removed or doesn't belong to your account.</p>
          <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg-deep)" }}>
      <div className="max-w-lg mx-auto mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-playfair gradient-text">Complete Payment</h1>
          <p className="text-sm text-[var(--text-muted)]">Activate your surprise website</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <PaymentPanel
          celebrationId={celebrationId}
          recipientName={celebration.recipientName}
          theme={celebration.theme}
          photoCount={celebration.photos?.length ?? 0}
          occasionType={celebration.occasionType}
          onSuccess={(slug) => router.push(`/dashboard/success?slug=${slug}`)}
        />
      </div>
    </main>
  );
}
