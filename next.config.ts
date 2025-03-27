import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    esmExternals: 'loose',  // ✅ Enable ESM support
  }
};

export default nextConfig;
