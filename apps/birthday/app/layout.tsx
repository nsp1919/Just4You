import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const BIRTHDAY_URL = process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL || "https://just4you.buzz";

export const metadata: Metadata = {
  metadataBase: new URL(BIRTHDAY_URL),
  title: "Just4You",
  description: "A beautiful personalized celebration surprise page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
