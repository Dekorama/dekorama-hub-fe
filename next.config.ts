import type { NextConfig } from "next";

const proxyTarget = (
  process.env.API_PROXY_TARGET ||
  "http://localhost:3001"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
