import { describe, expect, it } from "vitest";
import { getCatalogCategories, mergeCatalog } from "./catalog";
import type { ProjectSummary } from "./projects";

describe("project catalog merge", () => {
  it("gives manual overrides precedence over GitHub metadata", () => {
    const result = mergeCatalog(
      [{ name: "demo", htmlUrl: "https://github.com/kjw413/demo", description: "GitHub text", language: "TypeScript", topics: [], updatedAt: "2026-08-15T00:00:00Z", stars: 0, archived: false, fork: false }],
      [],
      [{ repoName: "demo", title: "수동 제목", summary: "수동 설명", category: "데이터·AI", included: true }],
    );
    expect(result[0]).toMatchObject({ title: "수동 제목", summary: "수동 설명", category: "데이터·AI" });
  });

  it("emits one row when Markdown and GitHub share repoName", () => {
    const github = [{ name: "demo", htmlUrl: "https://github.com/kjw413/demo", description: "GitHub text", language: "TypeScript", topics: [], updatedAt: "2026-08-15T00:00:00Z", stars: 0, archived: false, fork: false }];
    const markdown = [{ slug: "demo-case", repoName: "demo", title: "사례", summary: "설명", category: "웹·도구", stack: "TypeScript", github: github[0].htmlUrl, visibility: "PUBLIC", status: "completed", featured: null, order: 1 }] satisfies ProjectSummary[];
    expect(mergeCatalog(github, markdown, [])).toHaveLength(1);
    expect(mergeCatalog(github, markdown, [])[0].detailHref).toBe("/projects/demo-case/");
  });

  it("returns the canonical category filters in a stable order", () => {
    expect(getCatalogCategories()).toEqual([
      "제조·자동화",
      "데이터·AI",
      "임베디드",
      "웹·도구",
    ]);
  });

  it("excludes a repository only when its override explicitly opts out", () => {
    const github = [
      { name: "included", htmlUrl: "https://github.com/kjw413/included", description: "Included repository", language: "TypeScript", topics: [], updatedAt: "2026-08-15T00:00:00Z", stars: 0, archived: false, fork: false },
      { name: "excluded", htmlUrl: "https://github.com/kjw413/excluded", description: "Excluded repository", language: "Python", topics: [], updatedAt: "2026-08-14T00:00:00Z", stars: 0, archived: false, fork: false },
    ];

    expect(mergeCatalog(github, [], [{ repoName: "excluded", included: false }]).map((project) => project.repoName)).toEqual([
      "included",
    ]);
  });

  it("uses GitHub metadata and no detail route for a GitHub-only repository", () => {
    const result = mergeCatalog(
      [{ name: "sensor-lab", htmlUrl: "https://github.com/kjw413/sensor-lab", description: null, language: "C++", topics: ["embedded", "can"], updatedAt: "2026-08-15T00:00:00Z", stars: 7, archived: false, fork: false }],
      [],
      [],
    );

    expect(result[0]).toMatchObject({
      repoName: "sensor-lab",
      title: "sensor-lab",
      summary: "설명이 등록되지 않은 공개 저장소입니다.",
      category: "임베디드",
      stack: "C++ · embedded · can",
      githubUrl: "https://github.com/kjw413/sensor-lab",
      detailHref: null,
      visibility: "PUBLIC",
      updatedAt: "2026-08-15T00:00:00Z",
      stars: 7,
    });
  });

  it("sorts by featured rank, manual order, update time, then repository name", () => {
    const github = [
      { name: "zeta", htmlUrl: "https://github.com/kjw413/zeta", description: "Zeta", language: "TypeScript", topics: [], updatedAt: "2026-08-14T00:00:00Z", stars: 0, archived: false, fork: false },
      { name: "old", htmlUrl: "https://github.com/kjw413/old", description: "Old", language: "TypeScript", topics: [], updatedAt: "2026-08-13T00:00:00Z", stars: 0, archived: false, fork: false },
      { name: "featured", htmlUrl: "https://github.com/kjw413/featured", description: "Featured", language: "TypeScript", topics: [], updatedAt: "2026-08-12T00:00:00Z", stars: 0, archived: false, fork: false },
      { name: "alpha", htmlUrl: "https://github.com/kjw413/alpha", description: "Alpha", language: "TypeScript", topics: [], updatedAt: "2026-08-14T00:00:00Z", stars: 0, archived: false, fork: false },
      { name: "recent", htmlUrl: "https://github.com/kjw413/recent", description: "Recent", language: "TypeScript", topics: [], updatedAt: "2026-08-15T00:00:00Z", stars: 0, archived: false, fork: false },
      { name: "ordered", htmlUrl: "https://github.com/kjw413/ordered", description: "Ordered", language: "TypeScript", topics: [], updatedAt: "2026-08-11T00:00:00Z", stars: 0, archived: false, fork: false },
    ];
    const overrides = [
      { repoName: "featured", featured: 1, order: 50 },
      { repoName: "ordered", order: 1 },
    ];

    expect(mergeCatalog(github, [], overrides).map((project) => project.repoName)).toEqual([
      "featured",
      "ordered",
      "recent",
      "alpha",
      "zeta",
      "old",
    ]);
  });
});
