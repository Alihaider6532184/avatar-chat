import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We no longer need COOP/COEP headers because we are using a standalone Node.js TTS server
};

export default nextConfig;
