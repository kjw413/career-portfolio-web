import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "김종우 — 제조 현장 데이터·자동화 엔지니어",
  description:
    "전자전기공학을 기반으로 제조 현장, 데이터·AI, 임베디드 시스템을 연결하는 김종우의 포트폴리오. 모든 수치는 산출 조건과 확인 근거를 함께 공개합니다.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1020" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {/*
          React가 stylesheet 링크를 head로 올려 줍니다.
          Pretendard는 본문에 실제로 쓰인 글자만 내려받는 동적 서브셋이라,
          한글 웹폰트를 통째로 받는 것보다 훨씬 가볍습니다.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          no-page-custom-font는 Pages Router에서 페이지마다 글꼴을 넣는 것을 막는 규칙입니다.
          여기는 App Router의 루트 레이아웃이라 모든 페이지에 한 번만 들어갑니다.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        {children}
      </body>
    </html>
  );
}
