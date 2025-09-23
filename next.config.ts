import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Força o Turbopack a considerar este diretório como root do workspace
    root: __dirname,
  },
};

export default nextConfig;
