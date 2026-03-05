import type { NextConfig } from "next";

const basePath = process.env.GRAPHONI_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  serverExternalPackages: ["neo4j-driver", "pg"],
};

export default nextConfig;
