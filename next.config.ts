import type { NextConfig } from "next";

// API proxy lives in src/app/api/[...path]/route.ts (forwards Set-Cookie for mobile).
// Do not use rewrites for /api — they often drop Set-Cookie on Netlify.
const nextConfig: NextConfig = {};

export default nextConfig;
