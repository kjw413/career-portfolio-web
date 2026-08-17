import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExperienceAccordion from "./ExperienceAccordion";

describe("ExperienceAccordion", () => {
  it("keeps the concise summary and detailed evidence in one item", () => {
    const { container } = render(<ExperienceAccordion items={[{
      id: "demo", period: "2025 — 현재", organization: "BINGGRAE",
      role: "생산기술팀", summary: "5개 공장 데이터를 통합했습니다.",
      details: ["수집과 보고 흐름 구현"], tags: ["MANUFACTURING"]
    }]} />);
    const disclosure = container.querySelector("details");
    const disclosureSummary = disclosure?.querySelector("summary");

    expect(disclosure).toBeInTheDocument();
    expect(disclosureSummary).toBeInTheDocument();
    expect(screen.getByText("5개 공장 데이터를 통합했습니다.")).toBeInTheDocument();
    expect(screen.getByText("수집과 보고 흐름 구현")).toBeInTheDocument();
    expect(disclosureSummary).toHaveTextContent("상세 보기");
  });
});
