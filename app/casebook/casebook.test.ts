import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getProjectCatalog } from "../../lib/catalog";
import { getProfile } from "../../lib/content";
import { getMetric } from "../../lib/ledger";
import { getFeaturedProjects } from "../../lib/projects";

/** 현대자동차 등 일부 기업의 포트폴리오 첨부 한도. scripts/generate-portfolio-pdf.mjs와 같은 값 */
const MAX_PDF_BYTES = 2 * 1024 * 1024;

describe("포트폴리오 PDF (/casebook/)", () => {
  const featured = getFeaturedProjects(getProjectCatalog());

  it("대표 프로젝트마다 한 쪽 요약(casebook)이 있다", () => {
    const missing = featured.filter((project) => !project.casebook).map((project) => project.slug);
    expect(missing).toEqual([]);
  });

  it("결과로 싣는 수치는 원장에 있는 확정 수치뿐이다", () => {
    for (const project of featured) {
      for (const id of project.casebook?.metricIds ?? []) {
        expect(getMetric(id).status, `${project.slug} → ${id}`).toBe("확정");
      }
    }
  });

  it("생성된 PDF가 2MB 한도 안에 있다", () => {
    const href = getProfile().casebookHref;
    expect(href).not.toBeNull();
    const file = path.join(process.cwd(), "public", href!.replace(/^\//, ""));
    expect(fs.existsSync(file), `${file}이 없습니다. npm run build && npm run pdf`).toBe(true);
    expect(fs.statSync(file).size).toBeLessThanOrEqual(MAX_PDF_BYTES);
  });

  it("이력서 PDF도 같은 한도 안에 있다", () => {
    const href = getProfile().resumeHref!;
    const file = path.join(process.cwd(), "public", href.replace(/^\//, ""));
    expect(fs.statSync(file).size).toBeLessThanOrEqual(MAX_PDF_BYTES);
  });
});
