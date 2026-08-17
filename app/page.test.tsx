import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(cleanup);

function getFeaturedSection(): HTMLElement {
  const heading = screen.getByRole("heading", { name: "대표 프로젝트" });
  const section = heading.closest("section");
  if (!section) throw new Error("Featured Projects section is missing");
  return section;
}

describe("Home featured projects", () => {
  it("includes a detailed case whose featured rank exists only in the catalog override", () => {
    render(<Home />);

    const telechipsCard = within(getFeaturedSection()).getByRole("link", {
      name: /페달 오조작 감지 보조 시스템/,
    });
    expect(telechipsCard).toHaveAttribute(
      "href",
      "/projects/telechips-embedded-school-pmsa-project",
    );
    expect(telechipsCard).toHaveTextContent("TOPST D3 보드");
  });

  it("renders detailed cards in merged catalog featured order", () => {
    render(<Home />);

    expect(
      within(getFeaturedSection())
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([
      "공장 에너지 AI 플랫폼",
      "Universal RPA Studio",
      "MIS 데이터 수집 자동화",
      "페달 오조작 감지 보조 시스템",
    ]);
  });
});
