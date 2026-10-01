"use client";

/**
 * 첫 화면과 단계 설명(모으고 → 자동화하고 → 예측합니다)이 함께 쓰는 무대입니다.
 *
 * 3D 장면은 무대 전체 높이를 차지하는 트랙 안에 화면 높이로 고정(sticky)해 두고,
 * 글은 그 위로 흘러갑니다. 트랙이 무대 높이와 같으므로 장면은 무대 끝에서 멈추고
 * 다음 섹션을 덮지 않습니다.
 *
 * 카메라 단계는 화면 높이를 세어 정하지 않고 단계 글의 실제 위치로 정합니다.
 * 첫 화면이 화면보다 길어도(작은 노트북·태블릿) 단계 글이 화면을 채울 때 카메라가 그 단계에 섭니다.
 * 장면이 켜지지 않는 환경(모바일·모션 축소·WebGL 미지원)에서는 같은 자리에 포스터가 남습니다.
 */

import { useEffect, useRef, type ReactNode } from "react";
import HeroSceneGate from "./hero-scene";

type SceneMetric = { display: string; condition?: string };

/**
 * 무대 안에서 내려온 거리(y)를 단계 값으로 바꿉니다. anchors[k]는 단계 k가 화면 맨 위에
 * 닿는 거리이고(첫 화면은 0), 두 앵커 사이에서는 선형으로 넘어갑니다.
 */
export function stageValue(y: number, anchors: number[], viewport: number): number {
  const last = anchors.length - 1;
  for (let k = 0; k < last; k += 1) {
    if (y < anchors[k + 1]) {
      const span = Math.max(1, anchors[k + 1] - anchors[k]);
      return k + Math.max(0, y - anchors[k]) / span;
    }
  }
  return last + Math.max(0, y - anchors[last]) / Math.max(1, viewport);
}

export default function Stage({
  plants,
  metric,
  poster,
  posterDark,
  caption,
  children,
}: {
  plants: string[];
  metric?: SceneMetric;
  poster: string | null;
  posterDark: string | null;
  caption: string;
  children: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  /** 단계 값. 매 스크롤마다 바뀌므로 상태로 두지 않습니다(다시 렌더하지 않음). */
  const progress = useRef(0);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const steps = Array.from(node.querySelectorAll<HTMLElement>(".story-step"));

    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = node.getBoundingClientRect().top;
      const anchors = [0, ...steps.map((step) => step.getBoundingClientRect().top - top)];
      progress.current = stageValue(-top, anchors, window.innerHeight || 1);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [progress]);

  return (
    <div className="stage" id="stage" ref={stage}>
      <div className="stage-track">
        <div className="stage-scene">
          <HeroSceneGate
            plants={plants}
            metric={metric}
            poster={poster}
            posterDark={posterDark}
            caption={caption}
            progress={progress}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
