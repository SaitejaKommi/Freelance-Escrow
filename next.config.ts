import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/ox/ }
    ];
    return config;
  },
};

export default nextConfig;
