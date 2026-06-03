import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Just4You — Create a Beautiful Surprise Website in Minutes",
  description:
    "Surprise your loved ones with a stunning, personalized website for Birthdays, Anniversaries, Proposals, or Kids Birthdays. Upload photos, choose a theme, add a heartfelt letter. Share in seconds. Flat ₹299.",
  keywords: ["birthday website", "anniversary surprise website", "proposal surprise website", "kids birthday website", "personalized surprise online", "surprise gift India"],
  openGraph: {
    title: "Just4You — Animated Surprise Websites That Wow",
    description: "Create a personalized surprise website for ₹299. Beautiful animated themes, photo slideshows, music & interactive features.",
    url: "https://just4you.in",
    siteName: "Just4You",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-bg-deep text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
