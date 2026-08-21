"use client";
import Link from "next/link";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * BrandFooter — a subtle, self-contained "made with" banner rendered at the
 * bottom of every delivered wish page. It turns each shared surprise into a
 * growth loop: recipients who love the page can create their own in one tap.
 *
 * The band ships its own dark gradient background so it looks intentional on
 * top of any theme (light Minimal/Floral or dark Galaxy/Neon).
 */
export default function BrandFooter({ slug }: { slug?: string }) {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 50,
        padding: "40px 20px 48px",
        textAlign: "center",
        background: "linear-gradient(180deg, rgba(12,8,18,0) 0%, #0c0812 22%, #0c0812 100%)",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,224,196,0.14)",
            color: "#ffcf7a",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            marginBottom: 16,
          }}
        >
          <Sparkles size={12} /> MADE WITH{" "}
          <Heart size={11} fill="#ff6f9c" stroke="none" style={{ margin: "0 -2px" }} /> ON JUST4YOU.BUZZ
        </div>

        <h3
          style={{
            color: "#fff5ec",
            fontSize: "1.35rem",
            fontWeight: 700,
            lineHeight: 1.3,
            margin: "0 0 8px",
          }}
        >
          Want to surprise someone you love?
        </h3>
        <p style={{ color: "#b9a6be", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 22px" }}>
          Create your own personalized celebration website in minutes — photos, music &amp;
          heartfelt messages they&apos;ll treasure forever.
        </p>

        <Link
          href="/dashboard/create"
          onClick={() => trackEvent("viral_footer_cta_click", { slug })}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 26px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "#fff5ec",
            textDecoration: "none",
            background: "linear-gradient(135deg, #ff8a5c, #ff5f93)",
            boxShadow: "0 12px 30px rgba(255,95,147,0.32)",
          }}
        >
          Create My Surprise — from ₹199 <ArrowRight size={16} />
        </Link>
      </div>
    </footer>
  );
}
