/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
}

module.exports = nextConfig
