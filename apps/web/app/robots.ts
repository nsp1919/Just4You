import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/dashboard/", "/admin/", "/admin-access", "/api/", "/login", "/register", "/payment-return"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      ...["OAI-SearchBot", "ChatGPT-User", "GPTBot", "Google-Extended", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Applebot-Extended"].map((userAgent) => ({
        userAgent,
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
