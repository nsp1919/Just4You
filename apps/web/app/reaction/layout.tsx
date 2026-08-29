import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Record Your Reaction | Just4You.buzz",
  description: "Record a private reaction to a Just4You surprise.",
  robots: { index: false, follow: false },
};

export default function ReactionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}