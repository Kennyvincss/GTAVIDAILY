import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  // Cover art is rendered with bundled fonts read from disk at request time.
  outputFileTracingIncludes: {
    "/covers/[slug]": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
