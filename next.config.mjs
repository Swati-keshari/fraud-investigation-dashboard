/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Render's free Node plan has ~512MB RAM. Typecheck/ESLint during
  // `next build` OOMs there (and on a 400MB heap locally). Skip them on CI.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["./db/dev.db"],
  },
};

export default nextConfig;