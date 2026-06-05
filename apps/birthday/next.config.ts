import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Required for monorepo standalone builds — traces dependencies from the repo root
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

export default nextConfig;
