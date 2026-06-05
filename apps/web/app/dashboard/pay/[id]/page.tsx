"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import { ArrowLeft, CreditCard, Gift, Music, Camera, Sparkles } from "lucide-react";

// ─── Connectivity check ───────────────────────────────────────────────────────
async function canReachRazorpay(): Promise<boolean> {
  try {
    // Fetch the Razorpay checkout script as a HEAD request to confirm reachability
    const res = await fetch("https://checkout.razorpay.com/v1/checkout.js", {
      method: "HEAD",
      mode: "no-cors", // avoids CORS errors; success = reachable
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return true; // no-cors always resolves if server is reachable
  } catch {
    return false;
  }
}

// ─── Payment component (self-contained, same logic as Step5 in create flow) ──
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
  const [scriptReady, setScriptReady] = useState(false);

  const occasion = occasionType || "birthday";
  const occasionEmoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
  const occasionLabel = occasion === "anniversary" ? "Marriage Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";

  const isRedirectMode = !!process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL;

  // Load Razorpay checkout script dynamically
  useEffect(() => {
    if (isRedirectMode) return;
    if ((window as any).Razorpay) { setScriptReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError(
      "⚠️ Could not load the payment gateway. A browser extension (ad-blocker, privacy shield) may be blocking Razorpay. " +
      "Please disable extensions or try in an Incognito window."
    );
    document.body.appendChild(script);
  }, [isRedirectMode]);

  const handlePay = async () => {
    const paymentUrl = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL;
    if (paymentUrl) {
      setLoading(true);
      setError("");
      try {
        localStorage.setItem("pending_celebration_id", celebrationId);
        
        // Construct external payment URL with notes and prefill fields
        const urlObj = new URL(paymentUrl);
        urlObj.searchParams.set("notes[celebrationId]", celebrationId);

        // After payment Razorpay redirects back to our page
        const returnUrl = `${window.location.origin}/dashboard/payment-return`;
        urlObj.searchParams.set("callback_url", returnUrl);
        urlObj.searchParams.set("redirect", "true");

        if (user?.email) {
          urlObj.searchParams.set("prefill[email]", user.email);
        }
        if (user?.displayName) {
          urlObj.searchParams.set("prefill[name]", user.displayName);
        }
        
        window.location.href = urlObj.toString();
      } catch (err: any) {
        console.error("Redirect error:", err);
        setError("Failed to redirect to the payment gateway. Please try again.");
        setLoading(false);
      }
      return;
    }

    if (!scriptReady) { setError("Payment gateway is loading, please wait a moment."); return; }
    setLoading(true);
    setError("");

    // Pre-check: verify browser can reach Razorpay before opening modal
    const reachable = await canReachRazorpay();
    if (!reachable) {
      setError(
        "⚠️ Your browser can't reach Razorpay's servers. This is usually caused by:\n" +
        "• A browser extension (uBlock, AdGuard, Privacy Badger)\n" +
        "• A VPN or firewall blocking payment gateways\n\n" +
        "Fix: Open this page in an Incognito window (Ctrl+Shift+N) or disable extensions temporarily."
      );
      setLoading(false);
      return;
    }

    try {
      const token = await user!.getIdToken();

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ celebrationId }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        setError(errData.error ?? `Server error (${orderRes.status}). Please try again.`);
        setLoading(false);
        return;
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Just4You",
        description: `${occasionLabel} Website for ${recipientName} — ₹299`,
        image: "/logo.png",
        order_id: orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...response, celebrationId }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            onSuccess(result.slug);
          } else {
            setError("Payment verified but activation failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: { email: user?.email ?? "", name: user?.displayName ?? "" },
        theme: { color: "#a855f7" },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setError(`Payment failed: ${resp.error?.description ?? "Unknown error"}. Please try again.`);
        setLoading(false);
      });
      rzp.open();
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

      <div className="text-6xl font-bold gradient-text mb-1">₹299</div>
      <div className="text-xs text-[var(--text-muted)] mb-8">One-time payment • 1 year validity • Instant delivery</div>

      {error && (
        <div className="text-sm text-red-400 p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <button
        id="pay-button"
        onClick={handlePay}
        disabled={loading || (!isRedirectMode && !scriptReady)}
        className="btn-primary w-full justify-center py-4 text-base glow-purple disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <CreditCard size={20} />
        {!isRedirectMode && !scriptReady ? "Loading payment..." : loading ? "Opening payment..." : "Pay ₹299 & Go Live!"}
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
          // Already paid — redirect to dashboard
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
      {/* Header */}
      <div className="max-w-lg mx-auto mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-playfair gradient-text">Complete Payment</h1>
          <p className="text-sm text-[var(--text-muted)]">Activate your surprise website</p>
        </div>
      </div>

      {/* Step bar showing user is on step 5 */}
      <div className="max-w-lg mx-auto mb-6">
        <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
          {["Details", "Photos", "Music", "Preview", "Pay"].map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`px-3 py-1 rounded-full font-semibold ${
                i < 4 ? "text-green-400" : "text-white border"
              }`}
                style={i === 4 ? { background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.5)" } : {}}>
                {i < 4 ? "✓" : "5"} <span className="hidden sm:inline">{s}</span>
              </div>
              {i < 4 && <div className="w-4 h-px" style={{ background: i < 4 ? "#22c55e" : "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
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
