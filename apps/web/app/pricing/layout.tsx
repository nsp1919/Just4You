import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  path: "/pricing",
  title: "Birthday Website Pricing & Features | Just4You.buzz",
  description: "Create a personalized birthday or celebration website from ₹199. Compare included features, optional music, video, countdown, analytics, custom links and hosting.",
  keywords: ["birthday website price", "birthday website cost India", "online invitation price", "personalized website pricing"],
});

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}