import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "mammoth", "pdf-parse", "bcryptjs"],
};

export default nextConfig;
