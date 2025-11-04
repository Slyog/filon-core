import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true, // wichtig für browser-wasm
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
