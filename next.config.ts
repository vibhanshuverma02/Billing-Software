import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions: true,
  },
   /**
   * @param {import('webpack').Configuration} config - Webpack configuration
   * @returns {import('webpack').Configuration}
   */
  // @ts-ignore
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mjs$/,
      type: "javascript/auto",  // Handle ESM modules
    });

    config.resolve.fallback = {
      fs: false,
      path: false,
    };
    return config;
  }
};


export default nextConfig;
