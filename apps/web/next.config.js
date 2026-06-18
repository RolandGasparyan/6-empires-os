/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};
module.exports = nextConfig;
