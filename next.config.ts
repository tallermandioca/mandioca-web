import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-heavy app: every page reads the session, so the dynamic (non cache-components) model is simpler.
  cacheComponents: false,
  // Photos are compressed client-side (~300 KB each); this covers a form with several of them.
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
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
