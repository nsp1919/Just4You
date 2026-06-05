"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";

export default function PaymentReturnPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "activated" | "failed">("checking");
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Animate the dots
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  useEffect(() => {
    // Get celebrationId from localStorage (set before redirect to Razorpay)
    const celebrationId = localStorage.getItem("pending_celebration_id");

    if (!celebrationId) {
      // No pending celebration — go to dashboard
      router.replace("/dashboard");
      return;
    }

    // Listen to Firestore for real-time updates
    const unsub = onSnapshot(
      doc(db, COLLECTIONS.CELEBRATIONS, celebrationId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data?.isActive && data?.slug) {
          setStatus("activated");
          localStorage.removeItem("pending_celebration_id");

          // Small delay for UX then redirect to success page
          setTimeout(() => {
            router.replace(`/dashboard/success?slug=${data.slug}`);
          }, 2000);
        }
      },
      (error) => {
        console.error("Firestore listen error:", error);
        setStatus("failed");
      }
    );

    // Timeout after 3 minutes — if still pending, go to dashboard
    const timeout = setTimeout(() => {
      unsub();
      setStatus("failed");
    }, 3 * 60 * 1000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg-deep)" }}
    >
      {status === "checking" && (
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-2xl font-bold gradient-text mb-3 font-playfair">
            Payment Received!
          </h1>
          <p className="text-[var(--text-muted)] mb-8">
            Activating your surprise website{dots}
          </p>

          {/* Animated spinner */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div
              className="w-3 h-3 rounded-full animate-bounce"
              style={{ background: "var(--accent-purple)", animationDelay: "0ms" }}
            />
            <div
              className="w-3 h-3 rounded-full animate-bounce"
              style={{ background: "var(--accent-pink)", animationDelay: "150ms" }}
            />
            <div
              className="w-3 h-3 rounded-full animate-bounce"
              style={{ background: "var(--accent-purple)", animationDelay: "300ms" }}
            />
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            This usually takes a few seconds. Do not close this page.
          </p>
        </div>
      )}

      {status === "activated" && (
        <div className="text-center">
          <div className="text-7xl mb-6">✅</div>
          <h1 className="text-2xl font-bold gradient-text mb-3 font-playfair">
            Website Activated!
          </h1>
          <p className="text-[var(--text-muted)]">Redirecting you now...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center glass-card p-10 max-w-md">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-bold mb-3">Taking longer than expected</h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            Your payment was received. The website will activate shortly.
            Check your dashboard in a few minutes.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </main>
  );
}
