"use client";

/**
 * 빌더는 주소(URL)의 구성을 첫 렌더에서 바로 읽어야 하므로 브라우저에서만 그립니다.
 * 서버에서 기본 구성으로 먼저 그리면, 주소의 구성으로 바뀌는 순간 화면이 한 번 뒤집힙니다.
 */

import dynamic from "next/dynamic";
import type { PortfolioData } from "../../lib/portfolio";

const PortfolioBuilder = dynamic(() => import("./PortfolioBuilder"), {
  ssr: false,
  loading: () => <p className="pf-loading">구성을 불러오는 중입니다…</p>,
});

export default function BuilderLoader({ data }: { data: PortfolioData }) {
  return <PortfolioBuilder data={data} />;
}
