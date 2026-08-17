import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "김종우 — 시스템 문제 해결형 엔지니어",
  description:
    "전자전기공학을 기반으로 제조 현장, 데이터·AI, 임베디드 시스템을 연결하는 김종우의 포트폴리오",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
