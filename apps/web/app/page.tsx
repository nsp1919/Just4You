import type { Metadata } from "next";
import LandingClient from "./LandingClient";
import PrelaunchPage from "@/components/PrelaunchPage";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Just4You.buzz — Instant Surprise & Custom Websites",
  description:
    "Launch personalized surprise websites with instant delivery options, or work with Novantix Tech on a fully customised website for your brand, event or idea.",
  openGraph: {
    title: "Just4You.buzz — Instant Surprise & Custom Websites",
    description:
      "Launch a personalised celebration website instantly, or ask Novantix Tech to design a fully customised website around your idea.",
    type: "website",
  },
};

export default async function Home() {
  const launchSnapshot = await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("siteLaunch").get();
  const launchSettings = launchSnapshot.data();
  const launchAt = launchSettings?.launchAt?.toDate?.() as Date | undefined;
  if (launchSettings?.prelaunchEnabled === true && launchAt && launchAt.getTime() > Timestamp.now().toMillis()) {
    return <PrelaunchPage launchAt={launchAt.toISOString()} />;
  }
  return <LandingClient />;
}
