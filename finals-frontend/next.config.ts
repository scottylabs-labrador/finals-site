import type { NextConfig } from "next";

module.exports = {
  webpack: (config: NextConfig) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        "fs": false,
        "path": false,
        "os": false,
      }
    }
    return config
  },
};