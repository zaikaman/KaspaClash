import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Mark kaspa-wasm as external to avoid bundling issues with WASM
  serverExternalPackages: ["kaspa-wasm"],

  // Development optimizations
  ...(isDev && {
    productionBrowserSourceMaps: false,
    reactStrictMode: false, // Can cause double renders in dev
  }),

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

  // Configure allowed image hostnames
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
