/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // Disable telemetry in Docker
  experimental: {
    // Improve build performance
  },
}

export default nextConfig
