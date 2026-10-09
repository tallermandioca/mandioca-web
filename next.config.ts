import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-heavy app: every page reads the session, so the dynamic (non cache-components) model is simpler.
  cacheComponents: false,
  serverExternalPackages: ["@react-pdf/renderer"],
  // Photos are compressed client-side (~300 KB each); this covers a form with several of them.
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  images: {
    // 90 is used by the full-screen photo viewer (FotoAmpliable).
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
    ],
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
