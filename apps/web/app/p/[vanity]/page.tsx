import { redirect, notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";

// Custom memorable link resolver — /p/<vanity> → the celebration's wish page.
// A DNS-free alternative to true sub-domains (which need wildcard DNS).

export const dynamic = "force-dynamic";

const BIRTHDAY_URL = process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL || "";

export default async function VanityPage({ params }: { params: Promise<{ vanity: string }> }) {
  const { vanity } = await params;

  let slug = "";
  try {
    const reservation = await adminDb.collection("vanityLinks").doc(vanity).get();
    if (reservation.exists && reservation.data()?.celebrationId) {
      const celebration = await adminDb.collection("celebrations").doc(reservation.data()!.celebrationId).get();
      const data = celebration.data() as { slug?: string; isActive?: boolean; isBlocked?: boolean } | undefined;
      if (data?.slug && data.isActive && !data.isBlocked) slug = data.slug;
    } else {
      // Preserve custom links purchased before transactional reservations existed.
      const legacy = await adminDb.collection("celebrations").where("vanitySlug", "==", vanity).limit(1).get();
      if (!legacy.empty) {
        const data = legacy.docs[0].data() as { slug?: string; isActive?: boolean; isBlocked?: boolean };
        if (data.slug && data.isActive && !data.isBlocked) slug = data.slug;
      }
    }
  } catch {
    // fall through to notFound
  }

  if (!slug) notFound();
  redirect(`${BIRTHDAY_URL}/wish/${slug}`);
}
