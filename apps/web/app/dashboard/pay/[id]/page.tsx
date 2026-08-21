"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS, FEATURE_ADDONS, PRICE_INR, computePriceInr, formatInr } from "@/lib/constants";
import { ArrowLeft, CreditCard, Camera, Sparkles } from "lucide-react";

interface WalletCheckoutPreview {
  basePaise: number;
  amountPaise: number;
  referralDiscountPaise: number;
  walletAppliedInr: number;
  freeAddonFeatureId: string | null;
  freeAddonDiscountPaise: number;
}

// ─── Payment component ────────────────────────────────────────────────────────
function PaymentPanel({ celebrationId, recipientName, theme, photoCount, occasionType, priceInr, onSuccess }: {
  celebrationId: string;
  recipientName: string;
  theme: string;
  photoCount: number;
  occasionType: string;
  priceInr: number;
  onSuccess: (slug: string) => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<WalletCheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewRetryKey, setPreviewRetryKey] = useState(0);

  const occasion = occasionType || "birthday";
  const occasionEmoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
  const occasionLabel = occasion === "anniversary" ? "Marriage Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";
  const finalAmountInr = Math.round((preview?.amountPaise ?? priceInr * 100) / 100);
  const totalSavingsPaise = preview ? Math.max(0, preview.basePaise - preview.amountPaise) : 0;
  const freeAddonLabel = FEATURE_ADDONS.find((addon) => addon.id === preview?.freeAddonFeatureId)?.label;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setError("");
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/payment/benefits-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ celebrationId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "Unable to load wallet balance.");
        if (!cancelled) setPreview(result as WalletCheckoutPreview);
      } catch (previewError: any) {
        if (!cancelled) setError(previewError?.message ?? "Unable to load wallet balance.");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    void loadPreview();
    return () => { cancelled = true; };
  }, [celebrationId, previewRetryKey, user]);

  const handlePay = async () => {
    if (!preview) {
      setError("Wallet balance is still loading. Please try again.");
      return;
    }
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

      const checkout = await linkRes.json();
      const confirmedPreview: WalletCheckoutPreview = {
        basePaise: preview.basePaise,
        amountPaise: checkout.amount,
        referralDiscountPaise: checkout.referralDiscountPaise ?? 0,
        walletAppliedInr: checkout.walletAppliedInr ?? checkout.referralCreditAppliedInr ?? 0,
        freeAddonFeatureId: checkout.freeAddonFeatureId ?? null,
        freeAddonDiscountPaise: checkout.freeAddonDiscountPaise ?? 0,
      };
      setPreview(confirmedPreview);

      if (checkout.amount !== preview.amountPaise) {
        setError("Your wallet balance changed. Review the updated amount and tap Pay again.");
        setLoading(false);
        return;
      }

      // Save celebrationId so payment-return page can poll Firestore
      localStorage.setItem("pending_celebration_id", celebrationId);

      // Redirect to unique payment link — celebrationId is locked in notes
      window.location.href = checkout.paymentUrl;
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

      {previewLoading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6 text-sm text-[var(--text-muted)]">
          Loading your wallet balance...
        </div>
      )}

      {!previewLoading && preview && (
        <div className="rounded-2xl p-5 mb-6 text-left border border-purple-500/20 bg-white/[0.03]">
          <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
            <span>Package total</span>
            <span>{formatInr(Math.round(preview.basePaise / 100))}</span>
          </div>
          {preview.referralDiscountPaise > 0 && (
            <div className="flex items-center justify-between text-sm mt-3 text-green-400">
              <span>Legacy referral discount</span>
              <span>-{formatInr(Math.round(preview.referralDiscountPaise / 100))}</span>
            </div>
          )}
          {preview.walletAppliedInr > 0 && (
            <div className="flex items-center justify-between text-sm mt-3 text-green-400">
              <span>Wallet balance used</span>
              <span>-{formatInr(preview.walletAppliedInr)}</span>
            </div>
          )}
          {preview.freeAddonDiscountPaise > 0 && (
            <div className="flex items-center justify-between gap-4 text-sm mt-3 text-green-400">
              <span>Free add-on credit{freeAddonLabel ? ` (${freeAddonLabel})` : ""}</span>
              <span className="shrink-0">-{formatInr(Math.round(preview.freeAddonDiscountPaise / 100))}</span>
            </div>
          )}
          {totalSavingsPaise > 0 && (
            <div className="flex items-center justify-between text-sm font-semibold mt-4 pt-4 border-t border-white/10 text-green-400">
              <span>Total savings</span>
              <span>-{formatInr(Math.round(totalSavingsPaise / 100))}</span>
            </div>
          )}
          <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-white/10">
            <span className="font-semibold">Online amount to pay</span>
            <span className="text-3xl font-bold gradient-text">{formatInr(finalAmountInr)}</span>
          </div>
          {preview.walletAppliedInr > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              Your available wallet balance is applied automatically. Pay only the remaining {formatInr(finalAmountInr)} through Razorpay.
            </p>
          )}
        </div>
      )}

      <div className="text-xs text-[var(--text-muted)] mb-8">One-time payment • 1 year validity • Instant delivery</div>

      {error && (
        <div className="text-sm text-red-400 p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <button
        id="pay-button"
        onClick={handlePay}
        disabled={loading || previewLoading || !preview}
        className="btn-primary w-full justify-center py-4 text-base glow-purple disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <CreditCard size={20} />
        {previewLoading ? "Loading wallet..." : loading ? "Creating payment link..." : `Pay ${formatInr(finalAmountInr)} Online`}
      </button>

      {!previewLoading && !preview && error && (
        <button type="button" onClick={() => setPreviewRetryKey((key) => key + 1)} className="mt-3 text-sm font-semibold text-purple-300 underline">
          Retry wallet calculation
        </button>
      )}

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
  }, [user, authLoading, router]);

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
  }, [user, celebrationId, router]);

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
          priceInr={computePriceInr(celebration.selectedFeatures ?? [])}
          onSuccess={(slug) => router.push(`/dashboard/success?slug=${slug}`)}
        />
      </div>
    </main>
  );
}
