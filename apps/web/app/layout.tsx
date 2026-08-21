import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Manrope, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const weddingDisplay = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-wedding-display" });
const weddingBody = Manrope({ subsets: ["latin"], variable: "--font-wedding-body" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Just4You — Create a Beautiful Surprise Website in Minutes",
  description:
    "Create personalized wedding invitations and surprise websites for birthdays, anniversaries, proposals, and kids birthdays. Add photos, music and interactive reveals. From ₹149.",
  keywords: ["wedding invitation website", "birthday website", "anniversary surprise website", "proposal surprise website", "kids birthday website", "personalized surprise online", "surprise gift India"],
  openGraph: {
    title: "Just4You — Animated Surprise Websites That Wow",
    description: "Create a personalized surprise website from ₹149. Beautiful animated themes, photo slideshows, music & interactive features.",
    url: SITE_URL,
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${weddingDisplay.variable} ${weddingBody.variable}`}>
      <body className="font-sans antialiased bg-bg-deep text-white">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
