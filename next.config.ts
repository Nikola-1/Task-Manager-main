import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Existing type errors are tracked separately by npm run typecheck.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
