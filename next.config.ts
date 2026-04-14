import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    pwa: {
      dest: "public",
      disable: process.env.NODE_ENV === "development",
      register: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-webfonts",
            expiration: {
              maxEntries: 4,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "google-fonts-stylesheets",
            expiration: {
              maxEntries: 4,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
            },
          },
        },
        {
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "cdn-cache",
            expiration: {
              maxEntries: 32,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
      ],
    },
  },
};

export default nextConfig;
