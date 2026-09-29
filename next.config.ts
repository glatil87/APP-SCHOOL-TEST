import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photos are shrunk in the browser before upload; this leaves headroom.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
