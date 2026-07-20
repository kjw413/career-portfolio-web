import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "김종우 포트폴리오",
  description:
    "현장의 문제를 데이터와 시스템으로 해결하는 엔지니어 김종우의 커리어 포트폴리오",
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
