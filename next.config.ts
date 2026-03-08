import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
};

export default nextConfig;
