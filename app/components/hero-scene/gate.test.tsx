import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeroSceneGate from "./index";

/**
 * 3D는 부가물입니다. 켜지지 않는 조건에서도 그림과 설명이 남아야 하고,
 * 켜지면 안 되는 조건에서 켜지지 않아야 합니다.
 */

const props = {
  plants: ["남양주(1·2)", "김해", "논산", "광주(경기)", "경산"],
  poster: "/hero-poster.webp",
  posterDark: "/hero-poster-dark.webp",
  caption: "다섯 공장에서 데이터가 중앙 시스템으로 모이는 장면",
};

function stubMatchMedia(reduceMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("reduce") ? reduceMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })) as unknown as typeof window.matchMedia;
}

const original = window.matchMedia;

afterEach(() => {
  cleanup();
  window.matchMedia = original;
});

beforeEach(() => {
  vi.stubGlobal("requestIdleCallback", undefined);
});

describe("3D 장면 문지기", () => {
  it("장면이 켜지지 않아도 그림과 설명은 남는다", () => {
    stubMatchMedia(true);
    render(<HeroSceneGate {...props} />);

    const poster = screen.getByRole("img", { name: props.caption });
    expect(poster).toBeVisible();
    expect(poster).toHaveAttribute("src", "/hero-poster.webp");
    expect(screen.getByText(props.caption)).toBeVisible();
  });

  it("어두운 화면에서는 어두운 포스터를 쓴다", () => {
    stubMatchMedia(true);
    const { container } = render(<HeroSceneGate {...props} />);
    const source = container.querySelector("picture source");

    expect(source).toHaveAttribute("media", "(prefers-color-scheme: dark)");
    expect(source).toHaveAttribute("srcSet", "/hero-poster-dark.webp");
  });

  it("포스터가 아직 없으면 깨진 이미지를 보여 주지 않는다", () => {
    stubMatchMedia(true);
    render(<HeroSceneGate {...props} poster={null} posterDark={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(props.caption)).toBeVisible();
  });

  it("모션 축소 설정에서는 장면을 불러오지 않는다", () => {
    stubMatchMedia(true);
    const { container } = render(<HeroSceneGate {...props} />);

    expect(container.querySelector(".hero-scene-canvas")).toBeNull();
  });

  it("matchMedia가 없는 환경에서도 터지지 않는다", () => {
    // @ts-expect-error 오래된 브라우저와 테스트 DOM을 흉내 냅니다.
    delete window.matchMedia;

    expect(() => render(<HeroSceneGate {...props} />)).not.toThrow();
    expect(screen.getByText(props.caption)).toBeVisible();
  });
});
