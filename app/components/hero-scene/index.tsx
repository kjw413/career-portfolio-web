"use client";

/**
 * 3D 장면을 켤지 말지 정하는 문지기입니다.
 *
 * 장면은 어디까지나 부가물이라, 켜지지 않는 조건에서는 같은 구도로 미리 렌더한
 * 정적 이미지를 그대로 둡니다. 페이지의 내용과 수치는 3D가 없어도 전부 읽힙니다.
 */

import { useEffect, useRef, useState, type ComponentType } from "react";

type SceneProps = { plants: string[] };

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
}: {
  plants: string[];
  poster: string | null;
  posterDark: string | null;
  caption: string;
}) {
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
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

  // 화면 밖으로 나가면 렌더 루프를 멈춥니다.
  useEffect(() => {
    const node = frame.current;
    if (!node || !Scene) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [Scene]);

  return (
    <figure className="hero-scene" ref={frame}>
      <div className="hero-scene-frame">
        {/* 포스터가 아직 없으면 빈 판으로 둡니다. 깨진 이미지를 보여 주지 않습니다. */}
        {poster && (
          <picture>
            {posterDark && <source srcSet={posterDark} media="(prefers-color-scheme: dark)" />}
            <img src={poster} alt={caption} loading="lazy" decoding="async" />
          </picture>
        )}
        {Scene && (
          <div className={`hero-scene-canvas${visible ? " is-live" : ""}`}>
            {visible && <Scene plants={plants} />}
          </div>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
