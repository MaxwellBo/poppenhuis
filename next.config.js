/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Allow images from external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Environment variables
  env: {
    COMMIT_REF: process.env.COMMIT_REF,
    CONTEXT: process.env.CONTEXT,
    DEPLOY_ID: process.env.DEPLOY_ID,
  },
  // Webpack configuration for handling .ts files in edge-functions
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig
