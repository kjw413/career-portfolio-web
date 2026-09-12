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

/*
 * 웹폰트 스타일시트는 기본적으로 렌더를 막습니다. CDN이 느리면 그만큼 첫 화면이
 * 비어 있게 되는데(3초 지연 시 첫 페인트도 3.3초), 글꼴 하나 때문에 글을 못 읽게
 * 둘 수는 없습니다.
 *
 * 그래서 `media="print"`로 받아 렌더를 막지 않게 하고, 다 받은 뒤 `all`로 바꿔
 * 적용합니다. 받는 동안에는 본문 글꼴 스택의 시스템 한글 글꼴이 쓰이고,
 * 자바스크립트가 없으면 그대로 시스템 글꼴로 남습니다. 둘 다 읽는 데 문제가 없습니다.
 */
const SWAP_WEBFONTS = `
for (const link of document.querySelectorAll('link[data-webfont]')) {
  if (link.sheet) { link.media = 'all'; continue; }
  link.addEventListener('load', function () { this.media = 'all'; }, { once: true });
}
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Pretendard는 본문에 실제로 쓰인 글자만 내려받는 동적 서브셋이라,
          한글 웹폰트를 통째로 받는 것보다 훨씬 가볍습니다.
        */}
        <link
          rel="stylesheet"
          media="print"
          data-webfont=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          media="print"
          data-webfont=""
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: SWAP_WEBFONTS }} />
        {children}
      </body>
    </html>
  );
}
