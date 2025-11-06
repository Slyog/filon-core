import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack config needed for Automerge WebAssembly support
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true, // wichtig für browser-wasm
      layers: true,
    };

    // Exclude Node.js modules from client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Use browser export condition for Automerge
      config.resolve.conditionNames = [
        "browser",
        "import",
        "module",
        "require",
        "default",
      ];
    }

    return config;
  },
  // Empty Turbopack config to silence Next.js 16 warning
  // Note: Turbopack doesn't yet support asyncWebAssembly, so webpack is required
  turbopack: {},
};

export default nextConfig;
