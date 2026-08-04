import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent editor/debug log writes under .cursor from invalidating the webpack watcher.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/.git/**", "**/.cursor/**"],
    };
    return config;
  },
};

export default nextConfig;
