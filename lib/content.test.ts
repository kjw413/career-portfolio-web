import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProfile } from "./content";
import { getMetric, getTimeline } from "./ledger";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/** 방문자와 AI가 실제로 읽는 표면. 확정 전 수치와 금지 표현은 여기에 남아 있으면 안 됩니다. */
function publishedSources(): [string, string][] {
  const projects = readdirSync(join(process.cwd(), "content/projects"))
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => `content/projects/${file}`);
  const diagrams = readdirSync(join(process.cwd(), "public/projects"))
    .filter((file) => file.endsWith(".svg"))
    .map((file) => `public/projects/${file}`);

  return [
    "content/profile.json",
    ...projects,
    ...diagrams,
    "app/page.tsx",
  ].map((path) => [path, read(path)]);
}

describe("portfolio content", () => {
  it("takes the headline figures from the ledger instead of restating them", () => {
    const source = JSON.parse(read("content/profile.json"));

    expect(source.metrics).toBeUndefined();
    expect(source.headlineMetricIds).toContain("mis-rpa-daily-saving");
    expect(source.headlineMetricIds).toContain("forecast-mape-all");
  });

  it("states the MIS saving as the confirmed daily figure, not a retired monthly one", () => {
    const savedTime = getMetric("mis-rpa-daily-saving");

    expect(savedTime.display).toBe("일 40분");
    expect(savedTime.condition).toContain("14.7시간");
    expect(savedTime.label).toContain("본인");
  });

  it("keeps the same MIS saving figure in the metric, the case study and the diagram", () => {
    const caseStudy = read("content/projects/ai-elite-mis-rpa.md");
    const diagram = read("public/projects/mis-rpa-time-saving.svg");

    for (const source of [caseStudy, diagram]) {
      expect(source).toContain("40분");
      expect(source).toContain("14.7시간");
    }
  });

  it("publishes the MIS saving as the visible and the accessible headline of the diagram", () => {
    const svg = new DOMParser().parseFromString(
      read("public/projects/mis-rpa-time-saving.svg"),
      "image/svg+xml",
    );
    const headlineStats = [...svg.querySelectorAll(".t-stat")].map((node) => node.textContent);

    expect(headlineStats).toContain("일 40분");
    expect(svg.documentElement.getAttribute("aria-label")).toContain("14.7시간");
  });

  it("scopes the forecast error so 7% is never read as the all-source average", () => {
    const forecast = getMetric("forecast-mape-all");

    expect(forecast.display).toBe("MAPE 7.3%");
    expect(forecast.label).toContain("전 공장 · 전 에너지원 평균");
    expect(forecast.condition).toContain("최근 6개월");
    expect(getMetric("forecast-mape-power").notes).toContain("전체 성과로 쓰지 않는다");
  });

  it("fills the impact results from the ledger so they cannot drift", () => {
    const source = JSON.parse(read("content/profile.json"));
    const raw = source.impacts.map((impact: { result: string }) => impact.result).join(" ");
    const rendered = getProfile().impacts.map((impact) => impact.result).join(" ");

    expect(raw).toContain("{{metric:");
    expect(rendered).not.toContain("{{");
    expect(rendered).toContain("MAPE 7.3%");
    expect(rendered).toContain("일 40분");
  });

  it("keeps retired figures out of everything a visitor reads", () => {
    const retired = ["월 15시간", "월 16시간", "12.8시간", "연 약 154시간", "평균 표준오차"];
    const offenders = publishedSources().flatMap(([path, source]) =>
      retired.filter((value) => source.includes(value)).map((value) => `${path}: ${value}`),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps claims the ledger forbids out of everything a visitor reads", () => {
    const forbidden = [
      "이상 여부 판단 기준으로 사용",
      "수치 기반 관리 체계로 전환",
      "예측값 기준의 전사 관리 체계",
      "CAN can0·can1 송수신 구현",
      "SPI/CAN 통신을 구현",
      "선발 근거가 된 사전 성과",
    ];
    const offenders = publishedSources().flatMap(([path, source]) =>
      forbidden.filter((claim) => source.includes(claim)).map((claim) => `${path}: ${claim}`),
    );

    expect(offenders).toEqual([]);
  });

  it("says the embedded team project finished over UART rather than CAN", () => {
    const embedded = getProfile().impacts.find((item) => item.id === "embedded");
    const entry = getTimeline().find((item) => item.id === "telechips-school");
    const shown = entry?.items.flatMap((item) => [item.headline, ...item.highlights]).join(" ");

    expect(embedded?.action).toContain("UART");
    expect(shown).toContain("UART");
  });

  it("credits the AI Elite selection to the investment review automation", () => {
    const aiElite = getTimeline().find((item) => item.id === "ai-elite");

    expect(aiElite?.period).toContain("2026.05 수료");
    expect(aiElite?.summary).toContain("투자품의");
    expect(aiElite?.summary).not.toContain("예측모델");
  });

  it("computes the career-year wording instead of freezing it in the content", () => {
    const source = JSON.parse(read("content/profile.json"));
    expect(source.role).toContain("{{careerYear}}");

    expect(getProfile(new Date("2026-09-12T00:00:00")).role).toContain("3년차");
    expect(getProfile(new Date("2027-01-02T00:00:00")).role).toContain("4년차");
    expect(getProfile().role).not.toContain("{{");
  });

  it("puts the education and career facts a recruiter reads first on the profile", () => {
    const profile = getProfile();

    expect(profile.education.school).toContain("홍익대학교");
    expect(profile.education.degree).toContain("전자전기공학부");
    expect(profile.career.company).toBe("빙그레");
    expect(profile.career.startDate).toBe("2024-12-23");
    expect(profile.certifications.length).toBeGreaterThan(0);
  });

  it("never shows the same experience under two periods", () => {
    const shown = getTimeline().flatMap((entry) => entry.items.map((item) => item.cardId));

    expect(shown).toEqual([...new Set(shown)]);
  });

  it("gives every timeline entry a period, a role and a summary", () => {
    for (const entry of getTimeline()) {
      expect(entry.period).toMatch(/^\d{4}\.\d{2} ~ /);
      expect(entry.role.length).toBeGreaterThan(0);
      expect(entry.summary.length).toBeGreaterThan(0);
    }
  });

  it("builds the timeline items from the ledger instead of hand-written copy", () => {
    const shown = getTimeline()
      .flatMap((entry) => entry.items.flatMap((item) => [item.headline, ...item.highlights]))
      .join(" ");

    // 수치 토큰이 화면에 그대로 나가면 안 됩니다.
    expect(shown).not.toContain("{{");
    // 레지스트리를 거친 값이 그대로 보입니다.
    expect(shown).toContain("MAPE 7.3%");
    expect(shown).toContain("일 40분");
  });

  it("keeps experience content as the only field-evidence source", () => {
    const legacyReferences = [
      existsSync(join(process.cwd(), "content/field-projects.json"))
        ? "content/field-projects.json exists"
        : null,
      read("README.md").includes("content/field-projects.json")
        ? "README directs editors to content/field-projects.json"
        : null,
    ].filter(Boolean);

    expect(legacyReferences).toEqual([]);
  });
});
