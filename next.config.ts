import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pas de `output: "standalone"` : compatible Vercel / Netlify / `next start` sans réglage.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
