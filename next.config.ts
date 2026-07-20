import type { NextConfig } from "next";

// GitHub Pages serves project sites under /<repo-name>.
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH=/career-portfolio-web;
// local dev and other hosts (Vercel, Netlify, ...) leave it empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
