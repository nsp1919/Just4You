import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Manrope, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { siteEntityGraph } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const weddingDisplay = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-wedding-display" });
const weddingBody = Manrope({ subsets: ["latin"], variable: "--font-wedding-body" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;
const BING_SITE_VERIFICATION = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Just4You — Birthday Websites & Online Invitations",
  description:
    "Create personalized wedding invitations and surprise websites for birthdays, anniversaries, proposals, and kids birthdays. Add photos, music and interactive reveals. From ₹199.",
  keywords: ["wedding invitation website", "birthday website", "anniversary surprise website", "proposal surprise website", "kids birthday website", "personalized surprise online", "surprise gift India"],
  openGraph: {
    title: "Just4You — Animated Surprise Websites That Wow",
    description: "Create a personalized surprise website from ₹199. Beautiful animated themes, photo slideshows, music & interactive features.",
    url: SITE_URL,
    siteName: "Just4You",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Just4You — Birthday Websites & Online Invitations",
    description: "Create personalized birthday websites and online wedding invitations from ₹199.",
  },
  category: "technology",
  applicationName: "Just4You",
  creator: "Novantix Technologies",
  publisher: "Novantix Technologies",
  verification: {
    ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
    ...(BING_SITE_VERIFICATION ? { other: { "msvalidate.01": BING_SITE_VERIFICATION } } : {}),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en" className={`${inter.variable} ${playfair.variable} ${weddingDisplay.variable} ${weddingBody.variable}`}>
      <body className="font-sans antialiased bg-bg-deep text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteEntityGraph()) }}
        />
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
