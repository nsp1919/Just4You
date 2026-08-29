import type { MetadataRoute } from "next";
import { THEMES } from "@/lib/constants";
import { CAMPAIGNS } from "@/lib/miniCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";

export default function sitemap(): MetadataRoute.Sitemap {
  const contentUpdatedAt = new Date("2026-08-29T00:00:00.000Z");

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/delivery-policy",
    "/demo",
    "/gallery",
    "/pricing",
    "/privacy",
    "/refund-policy",
    "/birthday-website-for-girlfriend",
    "/birthday-surprise-for-best-friend",
    "/anniversary-website-for-husband",
    "/online-wedding-invitation",
    "/last-minute-birthday-surprise",
    "/reminders",
    "/terms",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: contentUpdatedAt,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : path.includes("website") || path.includes("invitation") || path.includes("surprise") ? 0.85 : 0.65,
  }));

  const occasionRoutes = ["wedding", "birthday", "proposal", "anniversary", "kids-birthday", "graduation"].map(
    (slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })
  );

  const demoRoutes = THEMES.filter((theme) => theme.id !== "wedding").map((t) => ({
    url: `${SITE_URL}/demo/${t.id}`,
    lastModified: contentUpdatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  demoRoutes.push({
    url: `${SITE_URL}/invite/demo`,
    lastModified: contentUpdatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  });

  const miniRoutes = [
    { url: `${SITE_URL}/mini`, lastModified: contentUpdatedAt, changeFrequency: "weekly" as const, priority: 0.7 },
    ...Object.keys(CAMPAIGNS).map((id) => ({
      url: `${SITE_URL}/mini/${id}`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...occasionRoutes, ...demoRoutes, ...miniRoutes];
}
