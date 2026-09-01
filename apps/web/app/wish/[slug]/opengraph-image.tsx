import { ImageResponse } from "next/og";
import { adminDb } from "@/lib/firebase-admin";

// Dynamic Open Graph image for shared wish links. Rendered when a link is
// pasted into WhatsApp / Instagram / iMessage / Twitter, replacing the bare
// URL with a branded, personalized preview card — a key growth lever since
// sharing is the product's primary distribution channel.

export const runtime = "nodejs";
export const alt = "A personalized celebration website made with Just4You.buzz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OccasionMeta = { greeting: string; emoji: string; accent: string; glow: string };

function occasionMeta(occasionType?: string): OccasionMeta {
  switch (occasionType) {
    case "kids-birthday":
      return { greeting: "Happy Birthday", emoji: "🧸", accent: "#f43f5e", glow: "rgba(244,63,94,0.35)" };
    case "anniversary":
      return { greeting: "Happy Anniversary", emoji: "💍", accent: "#ff6f9c", glow: "rgba(255,111,156,0.35)" };
    case "proposal":
      return { greeting: "A Surprise For", emoji: "💌", accent: "#c084fc", glow: "rgba(192,132,252,0.35)" };
    default:
      return { greeting: "Happy Birthday", emoji: "🎂", accent: "#ffcf7a", glow: "rgba(255,207,122,0.35)" };
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let recipientName = "You";
  let occasionType: string | undefined;
  let photo: string | undefined;

  try {
    const snap = await adminDb
      .collection("celebrations")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (!snap.empty) {
      const d = snap.docs[0].data() as {
        recipientName?: string;
        occasionType?: string;
        photos?: string[];
        isActive?: boolean;
        isBlocked?: boolean;
      };
      recipientName = d.recipientName || recipientName;
      occasionType = d.occasionType;
      if (d.photos && d.photos.length > 0) photo = d.photos[0];
    }
  } catch {
    // Fall back to a generic branded card if the lookup fails.
  }

  const { greeting, emoji, accent, glow } = occasionMeta(occasionType);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #18101e 0%, #201430 55%, #0f0913 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Warm glow orb */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: glow,
            filter: "blur(40px)",
            display: "flex",
          }}
        />

        {/* Left — text */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: photo ? 620 : 1040 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: accent,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 24,
            }}
          >
            <span>✦ JUST4YOU.BUZZ</span>
          </div>
          <div style={{ display: "flex", color: "#b9a6be", fontSize: 42, marginBottom: 6 }}>
            {greeting},
          </div>
          <div
            style={{
              display: "flex",
              color: "#fff5ec",
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {recipientName}! {emoji}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 40,
              padding: "16px 30px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #ff8a5c, #ff5f93)",
              color: "#fff5ec",
              fontSize: 30,
              fontWeight: 700,
              width: "fit-content",
            }}
          >
            Tap to open your surprise →
          </div>
        </div>

        {/* Right — recipient photo */}
        {photo ? (
          <div
            style={{
              display: "flex",
              width: 360,
              height: 460,
              borderRadius: 32,
              overflow: "hidden",
              border: `4px solid ${accent}`,
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            }}
          >
            <img src={photo} alt="" width={360} height={460} style={{ objectFit: "cover" }} />
          </div>
        ) : null}
      </div>
    ),
    { ...size }
  );
}
