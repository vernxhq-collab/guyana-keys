import type { NextConfig } from "next";
import { hostRedirects } from "./src/lib/site-origin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return hostRedirects();
  },
};

export default nextConfig;
