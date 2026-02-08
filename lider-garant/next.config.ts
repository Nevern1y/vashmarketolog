import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      {
        source: "/tendernoe-soprovojdenie",
        destination: "/tendernoe-soprovozhdenie",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
