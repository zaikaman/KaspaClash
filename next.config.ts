import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Mark kaspa-wasm as external to avoid bundling issues with WASM
  serverExternalPackages: ["kaspa-wasm", "isomorphic-ws"],
  
  // Experimental features for better WASM support
  experimental: {
    serverComponentsExternalPackages: ["kaspa-wasm"],
  },

  // Development optimizations
  ...(isDev && {
    productionBrowserSourceMaps: false,
    reactStrictMode: false, // Can cause double renders in dev
  }),

  // Use empty turbopack config to enable Turbopack by default
  // The webpack config is fallback for WASM support when needed
  turbopack: {},

  // Enable WASM support for Kaspa SDK (webpack fallback)
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Fix for WASM module resolution
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Ensure kaspa-wasm WASM files are properly handled on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'kaspa-wasm': 'commonjs kaspa-wasm',
      });
    }

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
