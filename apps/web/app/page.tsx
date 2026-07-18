import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Just4You.buzz — Personalized Surprise Websites for Every Celebration",
  description:
    "Turn birthdays, anniversaries, proposals and special moments into beautiful interactive surprise websites — photos, music, countdown reveals & heartfelt messages. Build your package from ₹149.",
};

export default function Home() {
  return <LandingClient />;
}
