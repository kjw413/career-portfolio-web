import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PortfolioData, PortfolioModule } from "../../lib/portfolio";
import PortfolioBuilder from "./PortfolioBuilder";

/**
 * 빌더에서 고른 것이 문서에 그대로 실리고, 그 구성이 주소에만 남는지를 지킵니다.
 */

function module(id: string, title: string, extra: Partial<PortfolioModule> = {}): PortfolioModule {
  return {
    id,
    kind: "experience",
    title,
    group: "빙그레",
    role: "단독 개발",
    period: "2026.04 ~ 2026.05",
    ongoing: false,
    status: "확정",
    excludeFor: [],
    headline: `${title} 한 줄 요약`,
    highlights: [`${title} 한 일`],
    metrics: [],
    teamContext: null,
    tags: [],
    bodyHtml: `<h2>배경</h2><p>${title} 본문</p>`,
    cover: null,
    links: [{ label: "수치의 산출 조건과 근거", href: `https://example.com/site/experience/${id}/` }],
    ...extra,
  };
}

const data: PortfolioData = {
  siteUrl: "https://example.com/site",
  person: { name: "김종우", nameEn: "Jong Woo Kim", email: "me@example.com", githubUrl: "https://github.com/kjw413" },
  role: "공장 데이터를 모으고, 자동화하고, 예측합니다.",
  summary: "소개 문단입니다.",
  headlineMetrics: [
    { id: "mape", display: "MAPE 7.3%", label: "예측 오차", condition: "최근 6개월", cardIds: ["EXP-FORECAST"] },
  ],
  history: [
    {
      id: "binggrae", kind: "career", organization: "빙그레 · 생산기술팀", role: "사원",
      period: "2024.12 ~ 재직 중", tenureFrom: "2024-12-23",
    },
  ],
  qualifications: [{ label: "학력", title: "홍익대학교 전자전기공학부 학사", detail: "2018.03 입학" }],
  skills: [{ title: "데이터 · AI", skills: ["Python", "SQL"] }],
  modules: [
    module("EXP-FORECAST", "예측모델 개발", {
      metrics: [{ id: "mape", display: "MAPE 7.3%", label: "예측 오차", condition: "최근 6개월" }],
      teamContext: "팀과제 안에서 예측모델 부분을 담당했다.",
    }),
    module("EXP-RPA", "수집 자동화"),
    module("EXP-EMBEDDED", "임베디드 보조시스템"),
    module("side-tool", "개인 도구", { kind: "project", group: "프로젝트", status: null, highlights: [] }),
  ],
  guides: [
    {
      job: "제조 AI·데이터",
      primary: ["EXP-FORECAST"],
      secondary: ["EXP-RPA", "EXP-PRIVATE"],
      exclude: ["EXP-EMBEDDED"],
      excludeReason: "임베디드 세부내용은 기본 제외",
    },
  ],
  defaultItems: [{ id: "EXP-RPA", level: "detail" }],
};

const documentOf = () => document.querySelector(".pf-doc") as HTMLElement;
const itemTitles = () =>
  [...documentOf().querySelectorAll(".pf-item h3")].map((heading) => heading.textContent);
const levelRadio = (title: string, label: string) =>
  within(screen.getByRole("group", { name: `${title} 싣는 방식` })).getByLabelText(label);

beforeEach(() => {
  window.history.replaceState(null, "", "/builder/");
  window.localStorage.clear();
});
afterEach(cleanup);

describe("포트폴리오 빌더", () => {
  it("주소에 구성이 없으면 기본 구성으로 연다", () => {
    render(<PortfolioBuilder data={data} />);
    expect(itemTitles()).toEqual(["수집 자동화"]);
    expect(documentOf()).toHaveTextContent("수집 자동화 본문");
  });

  it("주소의 구성을 순서와 상세도까지 그대로 연다", () => {
    window.history.replaceState(null, "", "/builder/?m=side-tool.s,EXP-FORECAST.d");
    render(<PortfolioBuilder data={data} />);

    expect(itemTitles()).toEqual(["개인 도구", "예측모델 개발"]);
    // 요약에는 본문을 싣지 않습니다.
    expect(documentOf()).not.toHaveTextContent("개인 도구 본문");
    expect(documentOf()).toHaveTextContent("예측모델 개발 본문");
  });

  it("직무군을 고르면 1순위는 상세, 보조는 요약으로 채우고 실을 수 없는 카드를 알린다", () => {
    render(<PortfolioBuilder data={data} />);
    fireEvent.change(screen.getByLabelText("직무군 프리셋"), { target: { value: "제조 AI·데이터" } });

    expect(itemTitles()).toEqual(["예측모델 개발", "수집 자동화"]);
    expect(levelRadio("예측모델 개발", "상세")).toBeChecked();
    expect(levelRadio("수집 자동화", "요약")).toBeChecked();
    expect(screen.getByText(/실을 수 없는 카드: EXP-PRIVATE/)).toBeInTheDocument();
  });

  it("직무에서 제외하기로 한 경험을 넣으면 막지 않고 알린다", () => {
    window.history.replaceState(null, "", "/builder/?job=제조 AI·데이터");
    render(<PortfolioBuilder data={data} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(levelRadio("임베디드 보조시스템", "요약"));

    expect(itemTitles()).toContain("임베디드 보조시스템");
    expect(screen.getByRole("status")).toHaveTextContent("임베디드 세부내용은 기본 제외");
  });

  it("고른 구성은 주소에 담기고, 제외하면 문서에서도 빠진다", () => {
    render(<PortfolioBuilder data={data} />);
    fireEvent.click(levelRadio("예측모델 개발", "요약"));
    expect(new URLSearchParams(window.location.search).get("m")).toBe("EXP-RPA.d,EXP-FORECAST.s");

    fireEvent.click(levelRadio("수집 자동화", "제외"));
    expect(itemTitles()).toEqual(["예측모델 개발"]);
    expect(new URLSearchParams(window.location.search).get("m")).toBe("EXP-FORECAST.s");
  });

  it("싣는 순서를 바꿀 수 있다", () => {
    window.history.replaceState(null, "", "/builder/?m=EXP-RPA.s,EXP-FORECAST.s");
    render(<PortfolioBuilder data={data} />);

    fireEvent.click(screen.getByRole("button", { name: "예측모델 개발 위로" }));
    expect(itemTitles()).toEqual(["예측모델 개발", "수집 자동화"]);
  });

  it("첫머리 수치는 고른 경험이 만든 것만 남긴다", () => {
    render(<PortfolioBuilder data={data} />);
    expect(documentOf().querySelector(".pf-metrics")).toBeNull();

    fireEvent.click(levelRadio("예측모델 개발", "요약"));
    expect(documentOf().querySelector(".pf-metrics")).toHaveTextContent("MAPE 7.3%");
  });

  it("팀 작업은 요약으로 실어도 본인 범위를 함께 싣는다", () => {
    window.history.replaceState(null, "", "/builder/?m=EXP-FORECAST.s");
    render(<PortfolioBuilder data={data} />);
    expect(documentOf()).toHaveTextContent("팀과제 안에서 예측모델 부분을 담당했다.");
  });

  it("추적 코드는 사이트로 가는 링크에만 붙는다", () => {
    render(<PortfolioBuilder data={data} />);
    fireEvent.change(screen.getByLabelText("추적 코드"), { target: { value: "a 07!" } });

    const hrefs = [...documentOf().querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("https://example.com/site/?ref=a07");
    expect(hrefs).toContain("https://example.com/site/experience/EXP-RPA/?ref=a07");
    expect(hrefs).toContain("https://github.com/kjw413");
    expect(new URLSearchParams(window.location.search).get("ref")).toBe("a07");
  });

  it("추가 연락처는 문서에는 실리지만 주소에는 들어가지 않는다", () => {
    render(<PortfolioBuilder data={data} />);
    fireEvent.change(screen.getByLabelText("추가 연락처"), { target: { value: "010-0000-0000" } });

    expect(documentOf()).toHaveTextContent("010-0000-0000");
    expect(decodeURIComponent(window.location.href)).not.toContain("010-0000-0000");
  });

  it("기본 이력 섹션을 끌 수 있다", () => {
    render(<PortfolioBuilder data={data} />);
    expect(documentOf()).toHaveTextContent("보유 기술");

    fireEvent.click(screen.getByLabelText("보유 기술"));
    expect(documentOf()).not.toHaveTextContent("보유 기술");
    expect(new URLSearchParams(window.location.search).get("hide")).toBe("skills");
  });

  it("재직기간은 고정 문구가 아니라 기준일로 계산한다", () => {
    window.history.replaceState(null, "", "/builder/?date=2026-11-10");
    render(<PortfolioBuilder data={data} />);
    expect(documentOf()).toHaveTextContent("2024.12 ~ 재직 중 · 1년 10개월");

    fireEvent.change(screen.getByLabelText("기준일"), { target: { value: "2027-01-05" } });
    expect(documentOf()).toHaveTextContent("2024.12 ~ 재직 중 · 2년");
  });
});
