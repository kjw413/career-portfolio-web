"use client";

/**
 * 홈의 머리글. 스크롤을 따라오고, 어두운 무대 위에 있는 동안에는 투명하게 두어
 * 장면을 가리지 않습니다. 무대를 지나면 본문 색의 불투명한 띠로 바뀝니다.
 *
 * 서버 렌더 결과는 무대 위 상태입니다. 페이지는 무대에서 시작하므로 첫 화면이 깜박이지 않습니다.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const [onStage, setOnStage] = useState(true);
  /** 조금이라도 내려왔는가. 무대 위에서도 글이 머리글 밑을 지나가면 반투명 막을 깝니다. */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stage = document.getElementById("stage");
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!stage || !header) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      setOnStage(stage.getBoundingClientRect().bottom > header.offsetHeight);
      setScrolled(window.scrollY > 8);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className="site-header is-overlay"
      data-tone={onStage ? "stage" : undefined}
      data-scrolled={scrolled ? "" : undefined}
    >
      <a className="wordmark" href="#top" aria-label="처음으로">
        <span>KJ</span>김종우
      </a>
      <nav aria-label="주요 메뉴">
        <a href="#impact">주요 성과</a>
        <a href="#projects">프로젝트</a>
        <a href="#experience">경력</a>
        <Link href="/experience/">경험 카드</Link>
        <a href="#contact">연락처</a>
      </nav>
      {/* 읽은 만큼 차오르는 선. 지원하지 않는 브라우저에서는 그리지 않습니다(CSS). */}
      <span className="scroll-progress" aria-hidden="true" />
    </header>
  );
}
