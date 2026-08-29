import LandingClient from "./LandingClient";
import PrelaunchPage from "@/components/PrelaunchPage";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { Timestamp } from "firebase-admin/firestore";
import { getPublicCelebrationProof } from "@/lib/public-proof";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = publicPageMetadata({
  path: "/",
  title: "Just4You.buzz — Instant Surprise & Custom Websites",
  description:
    "Launch personalized surprise websites with instant delivery options, or work with Novantix Tech on a fully customised website for your brand, event or idea.",
  keywords: ["birthday website", "online wedding invitation", "birthday surprise website", "personalized celebration website India"],
});

export default async function Home() {
  const launchSnapshot = await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("siteLaunch").get();
  const launchSettings = launchSnapshot.data();
  const launchAt = launchSettings?.launchAt?.toDate?.() as Date | undefined;
  if (launchSettings?.prelaunchEnabled === true && launchAt && launchAt.getTime() > Timestamp.now().toMillis()) {
    return <PrelaunchPage launchAt={launchAt.toISOString()} />;
  }
  const publicProof = await getPublicCelebrationProof(3);
  return <LandingClient publicProof={publicProof} />;
}
