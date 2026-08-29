import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/account areas out of the index.
        disallow: ["/dashboard/", "/admin/", "/admin-access", "/api/", "/login", "/register", "/payment-return"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
