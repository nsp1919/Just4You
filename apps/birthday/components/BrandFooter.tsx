"use client";
import { Sparkles, ArrowRight, Heart, Video } from "lucide-react";

/**
 * BrandFooter — subtle "made with" banner rendered at the bottom of every
 * delivered wish page. Turns each shared surprise into a growth loop.
 *
 * This runs on the birthday-templates app, so the CTA points to the main
 * platform (configurable via NEXT_PUBLIC_MAIN_APP_URL) rather than a local
 * route.
 */
const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://just4you.buzz";

interface BrandFooterProps {
  creditText?: string;
  celebrationId?: string;
  recipientName?: string;
  referralCode?: string;
}

export default function BrandFooter({ creditText, celebrationId, recipientName, referralCode }: BrandFooterProps) {
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
        {celebrationId && (
          <div style={{ marginBottom: 42, paddingBottom: 40, borderBottom: "1px solid rgba(255,224,196,0.12)" }}>
            <Video size={26} style={{ color: "#ff9e4f", margin: "0 auto 12px" }} />
            <span style={{ display: "inline-block", marginBottom: 10, padding: "5px 10px", borderRadius: 999, background: "rgba(52,211,153,0.1)", color: "#6ee7b7", fontSize: "0.7rem", fontWeight: 800 }}>
              ₹25 VERIFIED WALLET REWARD
            </span>
            <h3 style={{ color: "#fff5ec", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.3, margin: "0 0 8px" }}>
              Record your reaction for the person who made this
            </h3>
            <p style={{ color: "#b9a6be", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 18px" }}>
              Send a private 30-second video{recipientName ? ` after opening ${recipientName}'s surprise` : ""}. If the creator shares your consented branded reaction and the post is verified, they receive ₹25 in withdrawable wallet earnings.
            </p>
            <a href={`${MAIN_APP_URL}/reaction/${celebrationId}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 8, color: "#18101e", background: "#ffcf7a", fontSize: "0.9rem", fontWeight: 800, textDecoration: "none" }}>
              <Video size={16} /> Record my reaction
            </a>
          </div>
        )}
        {creditText && (
          <p
            style={{
              color: "#ffe6d0",
              fontSize: "0.9rem",
              fontWeight: 600,
              lineHeight: 1.5,
              margin: "0 0 16px",
            }}
          >
            {creditText}
          </p>
        )}
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
          {referralCode ? "Loved your surprise? Make one for someone else." : "Want to surprise someone you love?"}
        </h3>
        <p style={{ color: "#b9a6be", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 22px" }}>
          {referralCode ? "Join through this surprise and get ₹50 promotional credit toward your first creation." : "Create your own personalized celebration website in minutes — photos, music and heartfelt messages they'll treasure forever."}
        </p>

        <a
          href={referralCode ? `${MAIN_APP_URL}/register?ref=${encodeURIComponent(referralCode)}` : `${MAIN_APP_URL}/dashboard/create`}
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
          {referralCode ? "Create one and get ₹50" : "Create My Surprise — from ₹199"} <ArrowRight size={16} />
        </a>
      </div>
    </footer>
  );
}
