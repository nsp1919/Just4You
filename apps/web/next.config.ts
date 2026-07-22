import type { NextConfig } from "next";

// Baseline security headers applied to every response. A strict Content-Security
// -Policy is intentionally omitted here because the checkout (Razorpay), image
// CDN (Cloudinary) and inline theme styles would need a carefully tuned policy;
// these headers are the safe, non-breaking baseline.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Allow the Next.js dev server to accept requests proxied through public
  // tunnels (ngrok / Cloudflare / VS Code dev tunnels) when sharing locally.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.trycloudflare.com", "*.devtunnels.ms"],
  eslint: {
    // Theme components copied from birthday app have stylistic lint issues,
    // not runtime errors — ignore during build.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

