import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * 방문 통계는 부가물입니다. 스크립트를 못 받아도 사이트가 멈추지 않아야 하고,
 * 받았으면 페이지 보기와 지정한 클릭만 셉니다.
 */

// next/script는 테스트 DOM에서 스크립트를 실제로 받지 않으므로, 받은 것처럼 onLoad만 부릅니다.
vi.mock("next/script", () => ({
  default: ({ onLoad }: { onLoad?: () => void }) => {
    queueMicrotask(() => onLoad?.());
    return null;
  },
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import Analytics from "./Analytics";

type Win = Window & { goatcounter?: { count?: (vars: unknown) => void } };

afterEach(() => {
  cleanup();
  delete (window as Win).goatcounter;
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("방문 통계", () => {
  it("스크립트를 못 받아도 터지지 않는다", async () => {
    expect(() => render(<Analytics />)).not.toThrow();
    await flush();
  });

  it("준비되면 페이지 보기를 한 번 센다", async () => {
    const count = vi.fn();
    (window as Win).goatcounter = { count };
    render(<Analytics />);

    await waitFor(() => expect(count).toHaveBeenCalledWith({ path: window.location.pathname }));
  });

  it("data-goatcounter-click이 붙은 링크만 이벤트로 센다", async () => {
    const count = vi.fn();
    (window as Win).goatcounter = { count };
    const { container } = render(
      <>
        <Analytics />
        <a href="#resume" data-goatcounter-click="click-resume">
          <span>이력서</span>
        </a>
        <a href="#plain">일반 링크</a>
      </>,
    );
    // 페이지 보기가 세어졌다면 클릭 감시도 붙은 상태입니다.
    await waitFor(() => expect(count).toHaveBeenCalled());
    count.mockClear();

    container.querySelector("span")?.click();
    (container.querySelector('a[href="#plain"]') as HTMLAnchorElement).click();

    expect(count).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({ path: "click-resume", title: "click-resume", event: true });
  });
});
