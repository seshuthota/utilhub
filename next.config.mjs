import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Off: front-end-nav caching re-fetches every pushState/replaceState URL from a
  // worker, which includes tool input kept in query strings.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  // Runtime caching is same-origin only. Cross-origin responses (e.g. API Client
  // results), /api/ routes and RSC payloads are never cached. Note: each
  // urlPattern is serialized into the generated sw.js, so it must be
  // self-contained (no references to variables in this file).
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /\.(?:eot|otf|ttc|ttf|woff|woff2)$/i.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // Self-hosted WebAssembly (sql.js, dprint plugins, tree-sitter) for offline use
        urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.wasm$/i.test(url.pathname),
        handler: "CacheFirst",
        options: {
          cacheName: "static-wasm-assets",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:js)$/i.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-js-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(?:css)$/i.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-style-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // Same-origin pages only: skip API routes, RSC payloads, and any URL
        // with a query string (which can carry tool input).
        urlPattern: ({ url, request, sameOrigin }) =>
          sameOrigin &&
          request.method === "GET" &&
          !url.pathname.startsWith("/api/") &&
          url.search === "" &&
          !request.headers.has("RSC") &&
          !request.headers.has("Next-Router-State-Tree"),
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The old "API Tester" was merged into the API Client (its collections migrate on first load)
      { source: "/tools/api-tester", destination: "/tools/curl-tester", permanent: true },
    ];
  },

  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(react-native|react-native-fs|react-native-fetch-blob)$/,
      })
    );

    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },
};

export default withPWA(nextConfig);
