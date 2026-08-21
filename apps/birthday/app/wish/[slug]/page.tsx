import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { headers, cookies } from "next/headers";
import type { ComponentType } from "react";
import GalaxyTheme from "@/components/themes/GalaxyTheme";
import FloralTheme from "@/components/themes/FloralTheme";
import NeonTheme from "@/components/themes/NeonTheme";
import MinimalTheme from "@/components/themes/MinimalTheme";
import RetroTheme from "@/components/themes/RetroTheme";
import MagicalTheme from "@/components/themes/MagicalTheme";
import ExpiredPage from "@/components/ExpiredPage";
import CountdownPage from "@/components/CountdownPage";
import BrandFooter from "@/components/BrandFooter";
import WeddingInvitation from "@/components/wedding/WeddingInvitation";

interface Props {
  params: Promise<{ slug: string }>;
}

// Convert Firestore Admin Timestamps → plain ISO strings so Next.js can
// safely pass the object from Server → Client Components.
function serializeCelebration(data: any): any {
  const out: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof (val as any).toDate === "function") {
      // Firestore Admin Timestamp
      out[key] = (val as any).toDate().toISOString();
    } else if (Array.isArray(val)) {
      out[key] = val;
    } else {
      out[key] = val;
    }
  }
  return out;
}

async function getCelebration(slug: string) {
  const snap = await adminDb
    .collection("celebrations")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const raw = { id: snap.docs[0].id, ...snap.docs[0].data() };
  return { serialized: serializeCelebration(raw), docId: snap.docs[0].id };
}

/** Bot user-agents to skip view counting */
function isBot(userAgent: string) {
  return /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i.test(userAgent);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCelebration(slug);
  const celeb = result?.serialized;
  if (!celeb) return { title: "Just4You" };

  let title = `Happy Birthday, ${celeb.recipientName}! 🎂`;
  if (celeb.occasionType === "kids-birthday") {
    title = `Happy Birthday, ${celeb.recipientName}! 🧸`;
  } else if (celeb.occasionType === "anniversary") {
    title = `Happy Anniversary, ${celeb.recipientName}! 💍`;
  } else if (celeb.occasionType === "proposal") {
    title = `A Special Surprise for ${celeb.recipientName} 💌`;
  } else if (celeb.occasionType === "wedding") {
    title = `${celeb.weddingData?.couple?.partnerOne ?? "Our"} & ${celeb.weddingData?.couple?.partnerTwo ?? "Wedding"} | Wedding Invitation`;
  }

  const description = celeb.message?.slice(0, 155) ?? "A beautiful interactive celebration website made with Just4You";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WishPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCelebration(slug);

  if (!result) return notFound();
  const { serialized: celeb, docId } = result;

  if (!celeb.isActive || celeb.isBlocked) {
    return notFound();
  }

  // Check expiry — expiresAt is now an ISO string after serialization
  const now = new Date();
  const expiresAt = celeb.expiresAt ? new Date(celeb.expiresAt) : null;
  if (expiresAt && expiresAt < now) {
    return <ExpiredPage name={celeb.recipientName} />;
  }

  // ── Increment view count (server-side, atomic, no race conditions) ──────────
  // BUG-08: implement the cookie deduplication that was described in comments
  // but was never actually written. We read a short-lived session cookie; if
  // it's already set for this celebration we skip the increment entirely.
  const headersList = await headers();
  const cookieStore = await cookies();
  const viewCookieName = `vw_${docId}`;
  const userAgent = headersList.get("user-agent") ?? "";
  const alreadyCounted = cookieStore.has(viewCookieName);

  // Track whether we need to attach a Set-Cookie header to the response.
  let setViewCookie = false;

  if (!isBot(userAgent) && !alreadyCounted) {
    // Capture lightweight, privacy-friendly context for creator analytics.
    const ua = userAgent.toLowerCase();
    const device = /mobile|iphone|android|ipad/.test(ua)
      ? "mobile"
      : /tablet/.test(ua)
        ? "tablet"
        : "desktop";
    const referer = headersList.get("referer") || "";
    let refSource = "direct";
    if (referer) {
      try {
        const host = new URL(referer).hostname.replace(/^www\./, "");
        refSource = /wa\.me|whatsapp/.test(host)
          ? "whatsapp"
          : /instagram/.test(host)
            ? "instagram"
            : /facebook|fb\./.test(host)
              ? "facebook"
              : host;
      } catch {
        refSource = "other";
      }
    }
    const city = headersList.get("x-vercel-ip-city") || "";
    const country = headersList.get("x-vercel-ip-country") || "";
    try {
      await adminDb.collection("celebrations").doc(docId).update({
        views: FieldValue.increment(1),
      });
      // Write an enriched view log entry for analytics.
      await adminDb
        .collection("celebrations")
        .doc(docId)
        .collection("viewLog")
        .add({
          ts: FieldValue.serverTimestamp(),
          device,
          ref: refSource,
          city: city ? decodeURIComponent(city) : "",
          country,
        });
      setViewCookie = true;
    } catch {
      // Non-critical — don't fail the page if view counting breaks
    }
  }

  // ── Countdown check ─────────────────────────────────────────────────────────
  const eventDate = celeb.eventDate || celeb.birthdayDate;
  if (celeb.occasionType !== "wedding" && celeb.countdownEnabled && eventDate) {
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    if (event > now) {
      return (
        <CountdownPage
          recipientName={celeb.recipientName}
          eventDate={eventDate}
          occasionType={celeb.occasionType}
          theme={celeb.theme}
        />
      );
    }
  }

  // BUG-17: use ComponentType<any> from 'react' import instead of React.ComponentType
  // (React was never imported in this file, causing a TS error).
  const ThemeComponents: Record<string, ComponentType<any>> = {
    galaxy: GalaxyTheme,
    floral: FloralTheme,
    neon: NeonTheme,
    minimal: MinimalTheme,
    retro: RetroTheme,
    magical: MagicalTheme,
  };

  const Theme = ThemeComponents[celeb.theme] ?? GalaxyTheme;

  // If a view was counted this request, set a 1-hour cookie so subsequent
  // reloads/back-navigations don't increment the counter again.
  const themeJsx = celeb.occasionType === "wedding" && celeb.weddingData ? (
    <WeddingInvitation invitation={celeb.weddingData} />
  ) : (
    <>
      <Theme celebration={celeb} />
      <BrandFooter />
    </>
  );
  if (!setViewCookie) return themeJsx;

  const { NextResponse } = await import("next/server");
  const res = NextResponse.next();
  res.cookies.set(viewCookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  return themeJsx;
}
