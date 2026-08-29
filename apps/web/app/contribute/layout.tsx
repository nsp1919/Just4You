import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add to a Group Surprise | Just4You.buzz",
  robots: { index: false, follow: false },
};

export default function ContributeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}