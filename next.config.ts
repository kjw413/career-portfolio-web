import type { NextConfig } from "next";

// GitHub Pages serves project sites under /<repo-name>.
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH=/career-portfolio-web;
// local dev and other hosts (Vercel, Netlify, ...) leave it empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // 정적 호스트 어디서든 하위 페이지가 동작하도록 /projects/slug/index.html 형태로 생성
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
