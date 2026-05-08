import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = withPWA({
  turbopack: {},  // ← tells Next.js 16 you've acknowledged the webpack/turbopack conflict
  experimental: {},
});

export default nextConfig;