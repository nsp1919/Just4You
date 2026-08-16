import type { Metadata } from "next";
import LandingClient from "./LandingClient";

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

export default function Home() {
  return <LandingClient />;
}
