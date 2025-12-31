import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use empty turbopack config to enable Turbopack by default
  // The webpack config is fallback for WASM support when needed
  turbopack: {},

  // Enable WASM support for Kaspa SDK (webpack fallback)
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Fix for WASM module resolution
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },

  // WASM content type headers
  async headers() {
    return [
      {
        source: "/:all*(.wasm)",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
