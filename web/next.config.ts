import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: process.env.GRAPHONI_BASE_PATH || "",
  serverExternalPackages: ["neo4j-driver", "pg"],
};

export default nextConfig;
