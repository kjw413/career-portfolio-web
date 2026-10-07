"use client";

/**
 * 방문 통계(GoatCounter). 쿠키를 쓰지 않고 페이지 · 유입 경로 · 기기만 집계합니다.
 * 통계는 GoatCounter 대시보드(로그인)에서만 보이고, 이 저장소나 사이트에는 남지 않습니다.
 *
 * - 첫 방문과 사이트 안 이동(Next 링크)을 모두 세기 위해 자동 집계를 끄고 경로가 바뀔 때마다 직접 셉니다.
 * - 클릭 이벤트는 `data-goatcounter-click` 속성이 붙은 요소를 문서 단위로 위임해 셉니다.
 *   페이지 이동 뒤에 새로 그려진 링크도 빠지지 않습니다.
 * - 지원서 링크에 붙인 `?ref=코드`는 GoatCounter가 유입 경로로 읽습니다. 코드와 회사의
 *   대응표는 공개 저장소에 두지 않습니다.
 * - 로컬 개발 서버(localhost)에서는 GoatCounter가 스스로 세지 않습니다.
 */

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const GOATCOUNTER_ENDPOINT = "https://jwkim413.goatcounter.com/count";

type GoatCounter = {
  count?: (vars: { path?: string; title?: string; event?: boolean }) => void;
};

function counter(): GoatCounter | undefined {
  return (window as Window & { goatcounter?: GoatCounter }).goatcounter;
}

export default function Analytics() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // 페이지 보기: 스크립트가 준비된 뒤, 경로가 바뀔 때마다 한 번
  useEffect(() => {
    if (!ready) return;
    counter()?.count?.({ path: window.location.pathname });
  }, [ready, pathname]);

  // 클릭 이벤트: 이력서·GitHub·이메일 등 data-goatcounter-click이 붙은 요소
  useEffect(() => {
    if (!ready) return;
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.("[data-goatcounter-click]");
      const name = target?.getAttribute("data-goatcounter-click");
      if (name) counter()?.count?.({ path: name, title: name, event: true });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [ready]);

  // 단계 설명 끝(예측합니다)까지 읽었는지. 페이지를 열 때마다 한 번만 셉니다.
  useEffect(() => {
    if (!ready) return;
    const last = document.getElementById("story-predict");
    if (!last || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        counter()?.count?.({ path: "story-complete", title: "단계 설명 끝까지", event: true });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(last);
    return () => observer.disconnect();
  }, [ready, pathname]);

  return (
    <Script
      id="goatcounter"
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
      data-goatcounter={GOATCOUNTER_ENDPOINT}
      data-goatcounter-settings='{"no_onload": true, "no_events": true}'
      onLoad={() => setReady(true)}
    />
  );
}
