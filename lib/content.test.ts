import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getExperiences, getProfile } from "./content";

describe("portfolio content", () => {
  it("uses monthly units for saved-time metrics", () => {
    const savedTime = getProfile().metrics.find((item) => item.id === "saved-time");
    expect(savedTime?.value).toBe("월 15시간");
    expect(savedTime?.evidence).toBe("사내 업무 측정 기준 월 15시간");
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

    expect(headlineStats).toContain("월 15시간");
    expect(headlineStats).not.toContain("연 약 154시간");
    expect(accessibleDescription).toContain("월 15시간");
  });

  it("keeps the same saved-time figure in the metric, the case study and the diagram", () => {
    const savedTime = getProfile().metrics.find((item) => item.id === "saved-time");
    const caseStudy = readFileSync(
      join(process.cwd(), "content/projects/ai-elite-mis-rpa.md"),
      "utf8",
    );
    const diagram = readFileSync(
      join(process.cwd(), "public/projects/mis-rpa-time-saving.svg"),
      "utf8",
    );

    for (const source of [caseStudy, diagram]) {
      expect(source).toContain(savedTime?.value);
      expect(source).not.toContain("12.8시간");
    }
  });

  it("puts the education and career facts a recruiter reads first on the profile", () => {
    const profile = getProfile();

    expect(profile.education.school).toContain("홍익대학교");
    expect(profile.education.degree).toContain("전자전기공학부");
    expect(profile.career.company).toBe("빙그레");
    expect(profile.career.startDate).toBe("2024-12-23");
    expect(profile.certifications.length).toBeGreaterThan(0);
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
