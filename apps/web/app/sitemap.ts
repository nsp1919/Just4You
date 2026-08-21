import type { MetadataRoute } from "next";
import { THEMES } from "@/lib/constants";
import { CAMPAIGNS } from "@/lib/miniCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = ["", "/demo", "/gallery", "/login", "/register"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const occasionRoutes = ["wedding", "birthday", "proposal", "anniversary", "kids-birthday", "graduation"].map(
    (slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })
  );

  const demoRoutes = THEMES.filter((theme) => theme.id !== "wedding").map((t) => ({
    url: `${SITE_URL}/demo/${t.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  demoRoutes.push({
    url: `${SITE_URL}/invite/demo`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  });

  const miniRoutes = [
    { url: `${SITE_URL}/mini`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
    ...Object.keys(CAMPAIGNS).map((id) => ({
      url: `${SITE_URL}/mini/${id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...occasionRoutes, ...demoRoutes, ...miniRoutes];
}
