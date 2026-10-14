import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: {
    position: 'bottom-right',
  },
  images: {
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 's3.filebase.io' },
      { protocol: 'https', hostname: 'ipfs.filebase.io' },
      { protocol: 'https', hostname: '*.filebase.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
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
