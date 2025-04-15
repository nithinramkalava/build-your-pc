// next.config.mjs (or next.config.js)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... keep any other configurations you already have
  reactStrictMode: true, // example existing config

  // Add this eslint block:
  eslint: {
    // Warning: This allows production builds to complete even if
    // your project has ESLint errors. It is recommended to fix ESLint
    // errors and warnings before building for production.
    ignoreDuringBuilds: true,
  },

  // ... any other configurations
};

export default nextConfig; // Use 'module.exports = nextConfig;' if using next.config.js