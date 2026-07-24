import type { NextConfig } from "next";
import { env } from "./src/config/env";

const nextConfig: NextConfig = {
  output: "export",
  basePath: env.basePath,
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
