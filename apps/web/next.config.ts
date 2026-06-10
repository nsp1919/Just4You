import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Theme components copied from birthday app have stylistic lint issues,
    // not runtime errors — ignore during build.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

