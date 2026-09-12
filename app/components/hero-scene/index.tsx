"use client";

/**
 * 3D 장면을 켤지 말지 정하는 문지기입니다.
 *
 * 장면은 어디까지나 부가물이라, 켜지지 않는 조건에서는 같은 구도로 미리 렌더한
 * 정적 이미지를 그대로 둡니다. 페이지의 내용과 수치는 3D가 없어도 전부 읽힙니다.
 */

import { useEffect, useRef, useState, type ComponentType } from "react";

type SceneMetric = { display: string; condition?: string };
type SceneProps = { plants: string[]; active: boolean; metric?: SceneMetric };

function canRunScene(): boolean {
  // matchMedia가 없는 환경(오래된 브라우저, 테스트 DOM)에서는 켜지 않습니다.
  if (typeof window.matchMedia !== "function") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // 좁은 화면에서는 기본으로 끕니다. 배터리와 데이터를 쓸 만한 화면이 아닙니다.
  if (window.innerWidth < 720) return false;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory < 4) return false;

  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2"));
  } catch {
    return false;
  }
}

export default function HeroSceneGate({
  plants,
  poster,
  posterDark,
  caption,
  metric,
}: {
  plants: string[];
  poster: string | null;
  posterDark: string | null;
  caption: string;
  /** 장면의 패널에 적을 예측 오차. 원장에서 옵니다. */
  metric?: SceneMetric;
}) {
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  /** 한 번이라도 화면에 들어왔는가. 들어온 뒤에는 계속 붙여 둡니다. */
  const [seen, setSeen] = useState(false);
  /** 지금 화면에 있는가. 렌더 루프를 돌릴지 정합니다. */
  const [visible, setVisible] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canRunScene()) return;

    let cancelled = false;
    const start = () => {
      import("./HeroScene")
        .then((module) => {
          if (!cancelled) setScene(() => module.default);
        })
        // 청크를 못 받아도 포스터가 남아 있으므로 조용히 넘어갑니다.
        .catch(() => {});
    };

    const idle = window.requestIdleCallback?.(start, { timeout: 2500 });
    if (idle === undefined) {
      const timer = window.setTimeout(start, 400);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(idle);
    };
  }, []);

  /*
   * 화면 밖에서는 렌더 루프만 멈추고 캔버스는 그대로 둡니다.
   * 통째로 떼면 스크롤할 때마다 WebGL 컨텍스트를 다시 만들게 되는데,
   * 그 비용이 루프를 재우는 것보다 훨씬 큽니다.
   */
  useEffect(() => {
    const node = frame.current;
    if (!node || !Scene) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [Scene]);

  return (
    <figure className="hero-scene" ref={frame}>
      {/*
        장면이 켜지면 포스터를 감춥니다. 캔버스는 투명해서 포스터가 비치는데,
        마우스 시차로 장면이 움직이면 같은 그림이 두 겹으로 보였습니다.
      */}
      <div className={`hero-scene-frame${Scene && seen && visible ? " has-live" : ""}`}>
        {/* 포스터가 아직 없으면 빈 판으로 둡니다. 깨진 이미지를 보여 주지 않습니다. */}
        {poster && (
          <picture>
            {posterDark && <source srcSet={posterDark} media="(prefers-color-scheme: dark)" />}
            <img src={poster} alt={caption} loading="lazy" decoding="async" />
          </picture>
        )}
        {Scene && seen && (
          <div className={`hero-scene-canvas${visible ? " is-live" : ""}`}>
            <Scene plants={plants} active={visible} metric={metric} />
          </div>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
