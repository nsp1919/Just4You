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
    const snap = await adminDb
      .collection("celebrations")
      .where("vanitySlug", "==", vanity)
      .limit(1)
      .get();
    if (!snap.empty) {
      const c = snap.docs[0].data() as { slug?: string; isActive?: boolean; isBlocked?: boolean };
      if (c.slug && c.isActive && !c.isBlocked) slug = c.slug;
    }
  } catch {
    // fall through to notFound
  }

  if (!slug) notFound();
  redirect(`${BIRTHDAY_URL}/wish/${slug}`);
}
