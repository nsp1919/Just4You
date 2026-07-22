import type { NextConfig } from "next";

// Baseline, non-breaking security response headers for the public wish viewer.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
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
};

export default nextConfig;
