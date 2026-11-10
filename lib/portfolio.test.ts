import { describe, expect, it } from "vitest";
import { getAllCards, getMetrics } from "./ledger";
import { getPortfolioData, stripWriterSections } from "./portfolio";
import { getProjects } from "./projects";

/**
 * 빌더와 PDF에 실리는 것은 전부 원장과 프로젝트 사례에서 옵니다.
 * 여기서는 "실으면 안 되는 것이 실리지 않는지"를 지킵니다.
 */
describe("포트폴리오 모듈", () => {
  const data = getPortfolioData();
  const ids = new Set(data.modules.map((entry) => entry.id));
  const experiences = data.modules.filter((entry) => entry.kind === "experience");

  it("사이트에 공개한 경험 카드만 고를 수 있다", () => {
    for (const card of getAllCards()) {
      expect(`${card.id}: ${ids.has(card.id)}`).toBe(`${card.id}: ${card.publicOnSite}`);
    }
  });

  it("확정 전 수치는 싣지 않고, 채워지지 않은 수치 인용도 남기지 않는다", () => {
    const metrics = getMetrics();
    for (const entry of data.modules) {
      for (const metric of entry.metrics) {
        expect(`${metric.id}: ${metrics[metric.id].status}`).not.toBe(`${metric.id}: 미확정`);
      }
      expect([entry.headline, ...entry.highlights, entry.bodyHtml].join("\n")).not.toContain(
        "{{metric:",
      );
    }
  });

  it("쓰는 사람에게 남긴 메모는 제출 문서에 싣지 않는다", () => {
    for (const entry of experiences) {
      // 이 말이 본문에 남아 있다면 카드의 `## 작성 메모` 절로 옮겨야 합니다.
      const leaked = /작성 메모|확인이 필요한 것|자기소개서|사용자 확정/.exec(entry.bodyHtml)?.[0];
      expect(`${entry.id}: ${leaked ?? ""}`).toBe(`${entry.id}: `);
    }
  });

  it("경험 카드에 딸린 프로젝트 사례는 카드와 함께 나가므로 따로 고르지 않는다", () => {
    const covered = new Set(
      getAllCards()
        .filter((card) => card.publicOnSite)
        .flatMap((card) => card.projectSlugs),
    );
    const projectIds = data.modules.filter((entry) => entry.kind === "project").map((entry) => entry.id);

    expect(projectIds.length).toBeGreaterThan(0);
    for (const id of projectIds) expect(covered.has(id)).toBe(false);
    for (const project of getProjects()) {
      expect(covered.has(project.slug) || ids.has(project.slug)).toBe(true);
    }
  });

  it("기본 구성은 실을 수 있는 항목만 가리킨다", () => {
    expect(data.defaultItems.length).toBeGreaterThan(0);
    for (const item of data.defaultItems) expect(ids.has(item.id)).toBe(true);
  });

  it("문서 속 링크는 로컬에서 만들어도 배포 주소를 가리킨다", () => {
    expect(data.siteUrl).toMatch(/^https:\/\/.+\/career-portfolio-web$/);
    for (const entry of experiences) {
      expect(entry.links[0].href).toBe(`${data.siteUrl}/experience/${entry.id}/`);
    }
  });
});

describe("쓰는 사람용 절 걷어내기", () => {
  const body = [
    "## 배경",
    "문제가 있었습니다.",
    "",
    "## 성과",
    "줄였습니다.",
    "",
    "## 작성 메모",
    "합산하지 않습니다.",
    "",
    "### 화면 교체 이력",
    "v1에서 v2로.",
    "",
    "## 확인이 필요한 것",
    "기간이 미확정입니다.",
  ].join("\n");

  it("메모 절은 딸린 소제목까지 통째로 빼고 나머지는 그대로 둔다", () => {
    expect(stripWriterSections(body)).toBe("## 배경\n문제가 있었습니다.\n\n## 성과\n줄였습니다.");
  });

  it("메모 절이 없으면 아무것도 바꾸지 않는다", () => {
    expect(stripWriterSections("## 수행\n만들었습니다.")).toBe("## 수행\n만들었습니다.");
  });
});
