import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TimelineEntry } from "../../lib/ledger";
import Timeline from "./Timeline";

afterEach(cleanup);

const entries: TimelineEntry[] = [
  {
    id: "binggrae",
    kind: "career",
    period: "2024.12 ~ 재직 중",
    organization: "빙그레 · 생산담당 생산기술팀",
    role: "사원 · 유틸리티/에너지 관리",
    summary: "5개 공장의 데이터를 통합했습니다.",
    items: [
      {
        cardId: "EXP-BG-ENERGY-WEB",
        title: "5개 공장 에너지 관리 웹 시스템 구축",
        headline: "조회·예측·진단·보고를 통합 — 월 4시간 절감",
        highlights: [],
        status: "진행중",
      },
      {
        cardId: "EXP-BG-DATA-RPA",
        title: "데이터 수집 자동화",
        headline: "1회 40분 → 3분",
        highlights: [],
        status: "확정",
      },
    ],
    tags: ["생산기술", "제조 데이터"],
  },
  {
    id: "military",
    kind: "military",
    period: "2019.01 ~ 2020.08 전역",
    organization: "육군",
    role: "병장 만기제대 · 분대장",
    summary: "분대장으로 구성원 문제를 해결했습니다.",
    items: [],
    tags: ["리더십"],
  },
];

describe("Timeline", () => {
  it("shows the period, organization and role of each stint without opening it", () => {
    render(<Timeline entries={entries} />);

    expect(screen.getByText("2024.12 ~ 재직 중")).toBeVisible();
    expect(screen.getByText("빙그레 · 생산담당 생산기술팀")).toBeVisible();
    expect(screen.getByText("사원 · 유틸리티/에너지 관리")).toBeVisible();
  });

  it("sends each item to the experience card that carries its evidence", () => {
    render(<Timeline entries={entries} />);

    expect(
      screen
        .getByRole("link", { name: /5개 공장 에너지 관리 웹 시스템 구축/ })
        .getAttribute("href"),
    ).toMatch(/^\/experience\/EXP-BG-ENERGY-WEB\/?$/);
  });

  it("marks an item that is not settled yet, once the stint is opened", () => {
    render(<Timeline entries={entries} />);
    const details = screen.getAllByRole("group")[0] as HTMLDetailsElement;

    // 닫힌 상태에서는 기간·소속·역할만 보이고, 펼치면 항목별 상태가 따라옵니다.
    expect(details.open).toBe(false);
    expect(screen.getByText("진행중")).toBeInTheDocument();

    details.open = true;
    expect(screen.getByText("진행중")).toBeVisible();
  });

  it("keeps a stint with no published card readable instead of rendering an empty toggle", () => {
    render(<Timeline entries={entries} />);

    expect(screen.getByText("육군")).toBeVisible();
    expect(screen.getAllByRole("group")).toHaveLength(1);
  });

  it("opens and closes with the keyboard because it is a native details element", () => {
    render(<Timeline entries={entries} />);
    const toggle = screen.getByText(/한 일 2건/).closest("summary");

    expect(toggle).not.toBeNull();
    expect(toggle?.parentElement?.tagName).toBe("DETAILS");
  });
});
