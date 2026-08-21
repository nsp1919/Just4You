import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const weddingDisplay = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-wedding-display" });
const weddingBody = Manrope({ subsets: ["latin"], variable: "--font-wedding-body" });

const BIRTHDAY_URL = process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL || "https://just4you.buzz";

export const metadata: Metadata = {
  metadataBase: new URL(BIRTHDAY_URL),
  title: "Just4You",
  description: "A beautiful personalized celebration surprise page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${weddingDisplay.variable} ${weddingBody.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
