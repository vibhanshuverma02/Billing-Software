import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    turbo: {
      enabled: false,    // ✅ Correct syntax to disable Turbopack
    }
  }
};


export default nextConfig;
