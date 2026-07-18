import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Just4You — Create a Beautiful Surprise Website in Minutes",
  description:
    "Surprise your loved ones with a stunning, personalized website for Birthdays, Anniversaries, Proposals, or Kids Birthdays. Upload photos, choose a theme, add a heartfelt letter. Share in seconds. From ₹149.",
  keywords: ["birthday website", "anniversary surprise website", "proposal surprise website", "kids birthday website", "personalized surprise online", "surprise gift India"],
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
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
