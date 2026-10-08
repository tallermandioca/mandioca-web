import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-heavy app: every page reads the session, so the dynamic (non cache-components) model is simpler.
  cacheComponents: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
