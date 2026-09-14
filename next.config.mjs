/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Deploying via @opennextjs/cloudflare (see wrangler.jsonc / open-next.config.ts):
  // it runs on Workers' Node-compat runtime, NOT the Next.js edge runtime, so
  // do NOT add `export const runtime = 'edge'` to any route — that runtime
  // isn't supported by this adapter and will break the build.
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["./db/dev.db"],
  },
};

export default nextConfig;