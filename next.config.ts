import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpileModules: ["@repo/ui"],
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
