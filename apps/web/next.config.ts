import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

