import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["api.amwooglobal.com"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
