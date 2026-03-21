import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
};

export default nextConfig;
