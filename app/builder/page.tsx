import type { Metadata } from "next";
import { getPortfolioData } from "../../lib/portfolio";
import BuilderLoader from "./BuilderLoader";
import "./builder.css";

/**
 * 포트폴리오 빌더. 지원하는 곳에 맞춰 경험을 골라 PDF를 만드는 도구입니다.
 *
 * 메뉴에 걸지 않고 검색에도 잡히지 않게 두지만, 주소를 아는 사람은 열 수 있습니다.
 * 그래서 여기에는 사이트에 이미 공개한 내용만 내려보냅니다. 무엇을 골랐는지는
 * 고른 사람의 주소창에만 있고, 어디에도 저장되지 않습니다.
 */
export const metadata: Metadata = {
  // 인쇄 창이 제안하는 파일 이름과 PDF의 문서 제목이 됩니다.
  title: "김종우 포트폴리오",
  description: "경험 카드와 프로젝트 사례를 골라 제출용 포트폴리오 PDF를 만듭니다.",
  robots: { index: false, follow: false },
};

export default function BuilderPage() {
  return (
    <main className="pf-page">
      <BuilderLoader data={getPortfolioData()} />
      <noscript>
        <p className="pf-loading">포트폴리오 빌더는 자바스크립트가 켜져 있어야 동작합니다.</p>
      </noscript>
    </main>
  );
}
