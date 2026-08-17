import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getExperiences, getProfile } from "./content";

describe("portfolio content", () => {
  it("uses monthly units for saved-time metrics", () => {
    const savedTime = getProfile().metrics.find((item) => item.id === "saved-time");
    expect(savedTime?.value).toBe("월 약 12.8시간");
    expect(savedTime?.evidence).toBe("154 ÷ 12 = 월 약 12.8시간 (연 154시간 기준)");
    expect(savedTime?.evidence).toContain("154 ÷ 12");
    expect(savedTime?.value).not.toContain("연");
  });

  it("uses the monthly MIS saving as the visible and accessible SVG headline", () => {
    const source = readFileSync(
      join(process.cwd(), "public/projects/mis-rpa-time-saving.svg"),
      "utf8",
    );
    const svg = new DOMParser().parseFromString(source, "image/svg+xml");
    const headlineStats = [...svg.querySelectorAll(".t-stat")].map(
      (element) => element.textContent,
    );
    const accessibleDescription = svg.documentElement.getAttribute("aria-label");
    const calculationEvidence = [...svg.querySelectorAll(".t-stat-label")].map(
      (element) => element.textContent,
    );

    expect(headlineStats).toContain("월 약 12.8시간");
    expect(headlineStats).not.toContain("연 약 154시간");
    expect(accessibleDescription).toContain("월 약 12.8시간");
    expect(calculationEvidence).toContain(
      "37분 × 250영업일 ≈ 154시간, 154 ÷ 12",
    );
  });

  it("keeps every experience expandable with a concise summary", () => {
    for (const item of getExperiences()) {
      expect(item.summary.length).toBeGreaterThan(0);
      expect(item.details.length).toBeGreaterThanOrEqual(1);
      expect(item.details.length).toBeLessThanOrEqual(5);
    }
  });

  it("keeps experience content as the only field-evidence source", () => {
    const legacyReferences = [
      existsSync(join(process.cwd(), "content/field-projects.json"))
        ? "content/field-projects.json exists"
        : null,
      readFileSync(join(process.cwd(), "README.md"), "utf8").includes("content/field-projects.json")
        ? "README directs editors to content/field-projects.json"
        : null,
    ].filter(Boolean);

    expect(legacyReferences).toEqual([]);
  });
});
