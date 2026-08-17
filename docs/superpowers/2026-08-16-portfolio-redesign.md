# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 GitHub Pages 포트폴리오를 비즈니스 프로필 사진, 성과 중심 첫 화면, 펼침형 경험 카드, 전체 GitHub 저장소 자동 동기화를 갖춘 범용 엔지니어 포트폴리오로 개선한다.

**Architecture:** 수동 콘텐츠(JSON/Markdown)와 GitHub API에서 빌드 전에 생성한 캐시 JSON을 `repoName`으로 병합한다. Next.js는 병합된 데이터를 정적 HTML로 내보내고 GitHub Actions가 push·수동·일일 예약 실행마다 GitHub Pages에 배포한다. 별도 런타임 서버나 데이터베이스는 추가하지 않는다.

**Tech Stack:** TypeScript 5.9, Next.js 16 App Router, React 19, Tailwind CSS 4, Node.js 22, Vitest, GitHub REST API, GitHub Actions, GitHub Pages

## Global Constraints

- 중심 정체성은 `시스템 문제 해결형 엔지니어`다.
- 메인 화면은 C안의 사진/프로필 좌측, 소개/성과 우측 균형형 구조를 사용한다.
- 사진은 4:5 비즈니스 프로필 형식을 사용하며 파일이 없을 때 레이아웃이 깨지지 않아야 한다.
- 주요 CTA는 대표 프로젝트, 이력서, GitHub이며 이력서 파일이 없을 때 해당 버튼만 숨긴다.
- 절감시간은 연 단위가 아닌 `월 약 12.8시간`으로 표시하고 상세 근거에 `154 ÷ 12`를 남긴다.
- 경험은 요약 카드에서 펼쳐 보고, 주요 프로젝트만 별도 상세 페이지로 이동하는 혼합형을 사용한다.
- 대표 성과 우선, 전체 경험 연혁 후속 순서를 유지한다.
- 자동 데이터와 수동 데이터가 충돌하면 수동 데이터가 우선한다.
- 브라우저에서 GitHub API나 인증 토큰을 사용하지 않는다.
- `output: "export"`, `/career-portfolio-web` basePath, trailing slash를 유지한다.
- 외부 런타임 서버, 데이터베이스, 유료 폼 서비스는 추가하지 않는다.
- 360px 너비에서 수평 스크롤과 텍스트 겹침이 없어야 한다.
- 모션 축소 설정에서는 자동 이동과 큰 전환을 제거한다.

---

## Target File Map

### Create

- `vitest.config.ts` — 테스트 실행 환경
- `content/profile.json` — 소개, CTA, 성과 수치, 사진·이력서 경로
- `content/experience.json` — 경력·교육·인턴 연혁
- `content/project-overrides.json` — GitHub 자동 정보의 수동 보정과 노출 순서
- `content/generated/github-repos.json` — 마지막으로 성공한 GitHub 메타데이터 캐시
- `lib/content.ts` — 수동 콘텐츠 타입과 로더
- `lib/content.test.ts` — 성과 단위와 필수 필드 검증
- `lib/catalog.ts` — Markdown 프로젝트, GitHub 캐시, override 병합
- `lib/catalog.test.ts` — 수동 우선순위·중복 방지 검증
- `scripts/sync-github.mjs` — 공개 저장소 페이지네이션 수집 및 원자적 캐시 교체
- `scripts/sync-github.test.ts` — API 정규화와 실패 시 캐시 유지 검증
- `app/components/Hero.tsx` — 프로필 사진, 정체성, CTA, 대표 수치
- `app/components/Hero.test.tsx` — 사진·이력서 조건부 표시 검증
- `app/components/ImpactGrid.tsx` — 대표 성과 3건
- `app/components/ExperienceAccordion.tsx` — 접근 가능한 펼침형 연혁
- `app/components/ExperienceAccordion.test.tsx` — 요약·상세 콘텐츠 검증

### Modify

- `package.json`, `package-lock.json` — 테스트·동기화 명령과 개발 의존성
- `app/page.tsx` — 확정된 섹션 순서로 재구성
- `app/archive.tsx` — 통합 카탈로그, 외부 GitHub 링크, 빈 결과 처리
- `app/globals.css` — 디자인 토큰, Hero, 카드, 반응형 스타일
- `lib/projects.ts` — 사례 프로젝트가 카탈로그에 제공할 최소 메타데이터 보강
- `app/projects/[slug]/page.tsx` — 통일된 사례 목차와 월 단위 성과 표현
- `.github/workflows/deploy.yml` — 일일 동기화와 캐시 실패 정책
- `README.md` — 사진·이력서·경력·프로젝트 업데이트 방법

### Add Later When Supplied

- `public/profile.webp` — 4:5 비즈니스 프로필 사진
- `public/resume.pdf` — 다운로드용 이력서

---

### Task 1: Establish Validated Manual Content

**Files:**
- Create: `vitest.config.ts`
- Create: `content/profile.json`
- Create: `content/experience.json`
- Create: `content/project-overrides.json`
- Create: `lib/content.ts`
- Create: `lib/content.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `Profile`, `Metric`, `Impact`, `Experience`, `ProjectOverride`
- Produces: `getProfile(): Profile`, `getExperiences(): Experience[]`, `getProjectOverrides(): ProjectOverride[]`

- [ ] **Step 1: Install the test dependencies and add commands**

Run:

```bash
npm install --save-dev vitest@3.2.4 jsdom@26.1.0 @testing-library/react@16.3.0 @testing-library/jest-dom@6.6.3
```

Set these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "sync:github": "node scripts/sync-github.mjs"
  }
}
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: [],
    include: ["**/*.test.{ts,tsx}"],
    clearMocks: true,
  },
});
```

- [ ] **Step 3: Write the failing manual-content tests**

Create `lib/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getExperiences, getProfile } from "./content";

describe("portfolio content", () => {
  it("uses monthly units for saved-time metrics", () => {
    const savedTime = getProfile().metrics.find((item) => item.id === "saved-time");
    expect(savedTime?.value).toBe("월 약 12.8시간");
    expect(savedTime?.evidence).toContain("154 ÷ 12");
    expect(savedTime?.value).not.toContain("연");
  });

  it("keeps every experience expandable with a concise summary", () => {
    for (const item of getExperiences()) {
      expect(item.summary.length).toBeGreaterThan(0);
      expect(item.details.length).toBeGreaterThanOrEqual(1);
      expect(item.details.length).toBeLessThanOrEqual(5);
    }
  });
});
```

- [ ] **Step 4: Run the tests and verify the missing module failure**

Run: `npm test -- lib/content.test.ts`
Expected: FAIL because `lib/content.ts` does not exist.

- [ ] **Step 5: Add the manual JSON files**

Create `content/profile.json` with this shape and approved values:

```json
{
  "name": "김종우",
  "role": "시스템 문제 해결형 엔지니어",
  "major": "전자전기공학",
  "summary": "전자전기공학의 원리 이해, 제조 현장의 도메인 경험, 소프트웨어 구현력을 연결해 실제로 사용되는 해결책을 만듭니다.",
  "photoSrc": null,
  "resumeHref": null,
  "githubUrl": "https://github.com/kjw413",
  "emailHref": null,
  "metrics": [
    {
      "id": "cycle-time",
      "value": "40분 → 3분",
      "label": "MIS 수집 1회 작업시간",
      "evidence": "수작업 40분과 자동 실행 3분 비교"
    },
    {
      "id": "saved-time",
      "value": "월 약 12.8시간",
      "label": "반복 업무 절감시간",
      "evidence": "연 154시간 ÷ 12개월"
    },
    {
      "id": "forecast",
      "value": "MAPE 7%",
      "label": "전사 에너지 예측 오차",
      "evidence": "포트폴리오 프로젝트 검증 결과"
    },
    {
      "id": "coverage",
      "value": "5개 공장",
      "label": "에너지·생산 데이터 통합 범위",
      "evidence": "남양주1·남양주2·김해·광주·논산"
    }
  ],
  "impacts": [
    {
      "id": "mis-rpa",
      "title": "반복 수집 업무 자동화",
      "problem": "5개 공장의 MIS 데이터를 매일 수작업으로 수집",
      "action": "화면 수집, 검증, 표준 데이터셋 생성을 하나의 파이프라인으로 구현",
      "result": "1회 40분을 3분으로 단축, 월 약 12.8시간 절감",
      "projectSlug": "ai-elite-mis-rpa"
    },
    {
      "id": "bems",
      "title": "공장 에너지 데이터 통합",
      "problem": "공장별로 분산된 에너지·생산 데이터와 수작업 보고",
      "action": "수집·저장·예측·진단·보고 흐름을 하나의 웹 서비스로 연결",
      "result": "5개 공장 통합, 예측 오차 MAPE 7%",
      "projectSlug": "ai-elite-bems"
    },
    {
      "id": "embedded",
      "title": "인지·통신·제어 통합",
      "problem": "카메라 인지 결과를 실제 임베디드 제어로 전달해야 하는 팀 과제",
      "action": "YOLOv5 적색 신호 인지와 Linux·FreeRTOS 간 SPI/CAN 통신 검증",
      "result": "인지 결과가 제어까지 이어지는 시스템 경로 구현",
      "projectSlug": "telechips-embedded-school-pmsa-project"
    }
  ]
}
```

Create `content/experience.json` by moving the four current entries from `app/page.tsx` into objects with `id`, `period`, `organization`, `role`, `summary`, `details`, and `tags`. Use these IDs: `binggrae`, `ai-elite`, `telechips-school`, `inbody`.

Create `content/project-overrides.json`:

```json
[
  { "repoName": "ai-elite-bems-next", "title": "공장 에너지 AI 플랫폼", "category": "데이터·AI", "featured": 1, "order": 1, "included": true },
  { "repoName": "universal-rpa", "title": "Universal RPA Studio", "category": "제조·자동화", "featured": 2, "order": 2, "included": true },
  { "repoName": "AI-Elite_MIS_RPA", "title": "MIS 데이터 수집 자동화", "category": "제조·자동화", "featured": 3, "order": 3, "included": true },
  { "repoName": "telechips-embedded-school-pmsa-project", "title": "페달 오조작 감지 보조 시스템", "category": "임베디드", "featured": 4, "order": 4, "included": true }
]
```

- [ ] **Step 6: Implement typed loaders with runtime validation**

Create `lib/content.ts` with exported types and a `requireString` helper. Import the three JSON files, reject missing IDs and duplicate `repoName` values, and return frozen copies. The public signatures must be:

```ts
export type Metric = { id: string; value: string; label: string; evidence: string };
export type Impact = {
  id: string; title: string; problem: string; action: string;
  result: string; projectSlug: string | null;
};
export type Profile = {
  name: string; role: string; major: string; summary: string;
  photoSrc: string | null; resumeHref: string | null;
  githubUrl: string; emailHref: string | null;
  metrics: Metric[]; impacts: Impact[];
};
export type Experience = {
  id: string; period: string; organization: string; role: string;
  summary: string; details: string[]; tags: string[];
};
export type ProjectOverride = {
  repoName: string; title?: string; summary?: string; category?: string;
  featured?: number; order?: number; included: boolean;
};

export function getProfile(): Profile;
export function getExperiences(): Experience[];
export function getProjectOverrides(): ProjectOverride[];
```

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- lib/content.test.ts && npm run lint`
Expected: both commands PASS.

```bash
git add package.json package-lock.json vitest.config.ts content/profile.json content/experience.json content/project-overrides.json lib/content.ts lib/content.test.ts
git commit -m "feat: add validated portfolio content model"
```

---

### Task 2: Add Build-Time GitHub Repository Sync

**Files:**
- Create: `content/generated/github-repos.json`
- Create: `scripts/sync-github.mjs`
- Create: `scripts/sync-github.test.ts`

**Interfaces:**
- Produces: `normalizeRepo(repo): GithubRepo`
- Produces: `fetchAllRepos(fetchImpl, token): Promise<GithubRepo[]>`
- Produces: `syncGithubRepos({ fetchImpl, outputPath, token }): Promise<{ source: "network" | "cache"; count: number }>`
- Cache schema: `{ generatedAt: string, owner: "kjw413", repos: GithubRepo[] }`

- [ ] **Step 1: Seed a valid cache**

Create `content/generated/github-repos.json`:

```json
{
  "generatedAt": "2026-08-16T00:00:00.000Z",
  "owner": "kjw413",
  "repos": []
}
```

- [ ] **Step 2: Write failing sync tests**

Create `scripts/sync-github.test.ts` with three tests:

```ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { normalizeRepo, syncGithubRepos } from "./sync-github.mjs";

describe("GitHub repository sync", () => {
  it("keeps only public portfolio metadata", () => {
    expect(normalizeRepo({
      name: "demo", html_url: "https://github.com/kjw413/demo",
      description: "Demo", language: "TypeScript", topics: ["web"],
      updated_at: "2026-08-15T00:00:00Z", stargazers_count: 2,
      archived: false, fork: false, private: false
    })).toEqual({
      name: "demo", htmlUrl: "https://github.com/kjw413/demo",
      description: "Demo", language: "TypeScript", topics: ["web"],
      updatedAt: "2026-08-15T00:00:00Z", stars: 2,
      archived: false, fork: false
    });
  });

  it("uses the existing valid cache when the API fails", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "portfolio-sync-"));
    const outputPath = path.join(dir, "github-repos.json");
    await writeFile(outputPath, JSON.stringify({ generatedAt: "2026-08-16T00:00:00.000Z", owner: "kjw413", repos: [] }));
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(syncGithubRepos({ fetchImpl, outputPath, token: "" }))
      .resolves.toEqual({ source: "cache", count: 0 });
  });

  it("does not overwrite a valid cache with malformed API data", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "portfolio-sync-"));
    const outputPath = path.join(dir, "github-repos.json");
    const original = JSON.stringify({ generatedAt: "2026-08-16T00:00:00.000Z", owner: "kjw413", repos: [] });
    await writeFile(outputPath, original);
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "bad shape" }), headers: new Headers() });
    await syncGithubRepos({ fetchImpl, outputPath, token: "" });
    expect(await readFile(outputPath, "utf8")).toBe(original);
  });
});
```

- [ ] **Step 3: Run the tests and verify the missing script failure**

Run: `npm test -- scripts/sync-github.test.ts`
Expected: FAIL because `scripts/sync-github.mjs` does not exist.

- [ ] **Step 4: Implement paginated sync and atomic replacement**

Create `scripts/sync-github.mjs`. Use `https://api.github.com/users/kjw413/repos?per_page=100&type=public&sort=updated&page=N`, stop when a page returns fewer than 100 entries, remove private repositories, write to `<output>.tmp`, then rename it to the cache path. Export the three interfaces above. The failure path must parse the existing cache and return `{ source: "cache", count }`; if both API and cache are invalid, rethrow the API error. Use these headers only on the server-side request:

```js
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "kjw413-career-portfolio-web",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};
```

The executable entry point must call:

```js
await syncGithubRepos({
  fetchImpl: fetch,
  outputPath: path.join(process.cwd(), "content/generated/github-repos.json"),
  token: process.env.GITHUB_TOKEN ?? "",
});
```

- [ ] **Step 5: Verify network and fallback behavior**

Run:

```bash
npm test -- scripts/sync-github.test.ts
npm run sync:github
```

Expected: tests PASS; cache owner is `kjw413`; `repos` contains only public repositories and no token.

- [ ] **Step 6: Commit**

```bash
git add content/generated/github-repos.json scripts/sync-github.mjs scripts/sync-github.test.ts
git commit -m "feat: sync public GitHub repositories at build time"
```

---

### Task 3: Merge Automatic and Manual Project Data

**Files:**
- Create: `lib/catalog.ts`
- Create: `lib/catalog.test.ts`
- Modify: `lib/projects.ts`

**Interfaces:**
- Consumes: `getProjects()`, `getProjectOverrides()`, cached `GithubRepo[]`
- Produces: `CatalogProject`
- Produces: `getProjectCatalog(): CatalogProject[]`
- Produces: `getCatalogCategories(): string[]`

- [ ] **Step 1: Write failing precedence tests**

Create `lib/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mergeCatalog } from "./catalog";

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
    const markdown = [{ slug: "demo-case", repoName: "demo", title: "사례", summary: "설명", category: "웹·도구", stack: "TypeScript", github: github[0].htmlUrl, visibility: "PUBLIC", status: "completed", featured: null, order: 1 }];
    expect(mergeCatalog(github, markdown, [])).toHaveLength(1);
    expect(mergeCatalog(github, markdown, [])[0].detailHref).toBe("/projects/demo-case/");
  });
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- lib/catalog.test.ts`
Expected: FAIL because `lib/catalog.ts` does not exist.

- [ ] **Step 3: Implement the catalog contract**

Create `lib/catalog.ts` with this exported shape:

```ts
export type CatalogProject = {
  repoName: string;
  title: string;
  summary: string;
  category: "제조·자동화" | "데이터·AI" | "임베디드" | "웹·도구";
  stack: string;
  githubUrl: string | null;
  detailHref: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  ongoing: boolean;
  featured: number | null;
  order: number;
  updatedAt: string | null;
  stars: number;
};

export function mergeCatalog(
  githubRepos: GithubRepo[],
  markdownProjects: ProjectSummary[],
  overrides: ProjectOverride[],
): CatalogProject[];

export function getProjectCatalog(): CatalogProject[];
export function getCatalogCategories(): string[];
```

Merge by exact `repoName`. Apply precedence `override > Markdown frontmatter > GitHub metadata > defaults`. A GitHub-only repository uses its name as title, description or `설명이 등록되지 않은 공개 저장소입니다.` as summary, topics/language for stack, and the topic-based category rules below:

```ts
const CATEGORY_TOPICS = {
  "제조·자동화": ["manufacturing", "automation", "rpa", "bems", "fems"],
  "데이터·AI": ["ai", "ml", "data", "forecasting", "llm"],
  "임베디드": ["embedded", "can", "spi", "freertos", "opencv"],
} as const;
```

If no topic matches, use `웹·도구`. Exclude only entries whose override has `included: false`. Sort by `featured`, then `order`, then `updatedAt` descending, then `repoName` ascending.

- [ ] **Step 4: Expose a body-free project summary from `lib/projects.ts`**

Add `ProjectSummary = Omit<Project, "bodyHtml" | "cover" | "gallery" | "tags" | "intro" | "kind" | "period">` and `getProjectSummaries(): ProjectSummary[]`. Keep current detailed-project functions unchanged.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- lib/catalog.test.ts && npm run lint`
Expected: PASS.

```bash
git add lib/catalog.ts lib/catalog.test.ts lib/projects.ts
git commit -m "feat: merge GitHub metadata with manual project content"
```

---

### Task 4: Build the Portrait-Led Hero and Page Skeleton

**Files:**
- Create: `app/components/Hero.tsx`
- Create: `app/components/Hero.test.tsx`
- Create: `app/components/ImpactGrid.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `Profile`, `Impact[]`
- Produces: `<Hero profile={profile} />`
- Produces: `<ImpactGrid impacts={profile.impacts} />`

- [ ] **Step 1: Write failing Hero visibility tests**

Create `app/components/Hero.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Hero from "./Hero";

const profile = {
  name: "김종우", role: "시스템 문제 해결형 엔지니어", major: "전자전기공학",
  summary: "현장과 시스템을 연결합니다.", photoSrc: null, resumeHref: null,
  githubUrl: "https://github.com/kjw413", emailHref: null,
  metrics: [{ id: "saved-time", value: "월 약 12.8시간", label: "반복 업무 절감시간", evidence: "연 154시간 ÷ 12개월" }],
  impacts: []
};

describe("Hero", () => {
  it("shows identity and initials without a photo", () => {
    render(<Hero profile={profile} />);
    expect(screen.getByRole("heading", { name: "시스템 문제 해결형 엔지니어" })).toBeInTheDocument();
    expect(screen.getByLabelText("프로필 사진 준비 중")).toHaveTextContent("KJ");
  });

  it("hides the resume action until a file exists", () => {
    render(<Hero profile={profile} />);
    expect(screen.queryByRole("link", { name: "이력서" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/kjw413");
  });
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- app/components/Hero.test.tsx`
Expected: FAIL because `Hero.tsx` does not exist.

- [ ] **Step 3: Implement Hero with conditional assets**

`Hero.tsx` must render:

```tsx
<section className="profile-hero" id="top">
  <div className="profile-panel">
    {profile.photoSrc ? (
      <img className="profile-photo" src={profile.photoSrc} alt={`${profile.name} 비즈니스 프로필 사진`} />
    ) : (
      <div className="profile-placeholder" aria-label="프로필 사진 준비 중">KJ</div>
    )}
    <p className="profile-name">{profile.name}</p>
    <p>{profile.major}</p>
  </div>
  <div className="hero-content">
    <p className="eyebrow">MANUFACTURING · DATA/AI · EMBEDDED SYSTEM</p>
    <h1>{profile.role}</h1>
    <p className="hero-description">{profile.summary}</p>
    <div className="hero-actions">
      <a className="button primary" href="#projects">대표 프로젝트</a>
      {profile.resumeHref && <a className="button secondary" href={profile.resumeHref}>이력서</a>}
      <a className="button secondary" href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
    </div>
    <dl className="hero-metrics">
      {profile.metrics.map((metric) => <div key={metric.id}><dt>{metric.value}</dt><dd>{metric.label}</dd></div>)}
    </dl>
  </div>
</section>
```

Use `withBasePath()` for local `photoSrc` and `resumeHref` values.

- [ ] **Step 4: Implement Selected Impact**

`ImpactGrid.tsx` renders three `<article>` elements. Each contains a large result, title, one-line problem, one-line action, and a project link when `projectSlug` is non-null. Use the labels `PROBLEM`, `ACTION`, `RESULT` consistently.

- [ ] **Step 5: Recompose `app/page.tsx`**

Remove the current abstract `.system-visual` and scrolling metrics duplicate. Read `profile`, `experiences`, and catalog through their loader functions. Set section order to Hero, Selected Impact, Featured Projects, Experience, Capability Map, Project Archive, Foundation, Contact. Keep the existing project detail routes and current capability content for the first pass.

- [ ] **Step 6: Add the C-layout design tokens and responsive grid**

Replace the root palette with:

```css
:root {
  --paper: #f8fafc;
  --surface: #ffffff;
  --ink: #0f172a;
  --blue: #2563eb;
  --blue-dark: #1e3a8a;
  --sky: #eaf3ff;
  --cyan: #38bdf8;
  --line: #dce5f0;
  --muted: #64748b;
  --radius: 20px;
}

.profile-hero {
  display: grid;
  grid-template-columns: minmax(280px, 0.36fr) minmax(0, 0.64fr);
  min-height: calc(100vh - 86px);
}
.profile-photo,
.profile-placeholder { width: 100%; aspect-ratio: 4 / 5; border-radius: var(--radius); }
.profile-photo { object-fit: cover; object-position: center top; }
.hero-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (max-width: 900px) {
  .profile-hero { grid-template-columns: 1fr; }
  .profile-panel { max-width: 420px; }
  .hero-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .hero-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .hero-actions .primary { grid-column: 1 / -1; }
}
```

- [ ] **Step 7: Verify and commit**

Run: `npm test -- app/components/Hero.test.tsx && npm run lint && npm run build`
Expected: PASS; static export includes the home page and project detail pages.

```bash
git add app/components/Hero.tsx app/components/Hero.test.tsx app/components/ImpactGrid.tsx app/page.tsx app/globals.css
git commit -m "feat: redesign portfolio hero around profile and impact"
```

---

### Task 5: Add Unified Expandable Experience Cards

**Files:**
- Create: `app/components/ExperienceAccordion.tsx`
- Create: `app/components/ExperienceAccordion.test.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `Experience[]`
- Produces: `<ExperienceAccordion items={experiences} />`

- [ ] **Step 1: Write the failing semantic markup test**

Create `app/components/ExperienceAccordion.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExperienceAccordion from "./ExperienceAccordion";

describe("ExperienceAccordion", () => {
  it("keeps the concise summary and detailed evidence in one item", () => {
    render(<ExperienceAccordion items={[{
      id: "demo", period: "2025 — 현재", organization: "BINGGRAE",
      role: "생산기술팀", summary: "5개 공장 데이터를 통합했습니다.",
      details: ["수집과 보고 흐름 구현"], tags: ["MANUFACTURING"]
    }]} />);
    expect(screen.getByText("5개 공장 데이터를 통합했습니다.")).toBeInTheDocument();
    expect(screen.getByText("수집과 보고 흐름 구현")).toBeInTheDocument();
    expect(screen.getByText("상세 보기")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- app/components/ExperienceAccordion.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement native expandable items**

Use `<details>` and `<summary>` so keyboard support and open state work without client JavaScript:

```tsx
export default function ExperienceAccordion({ items }: { items: Experience[] }) {
  return <div className="experience-list">
    {items.map((item) => (
      <details className="experience-card" key={item.id}>
        <summary>
          <span className="experience-period">{item.period}</span>
          <span><small>{item.organization}</small><strong>{item.role}</strong></span>
          <span className="experience-summary">{item.summary}</span>
          <span className="experience-toggle">상세 보기</span>
        </summary>
        <div className="experience-detail">
          <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
      </details>
    ))}
  </div>;
}
```

Add an open-state CSS label using `.experience-card[open] .experience-toggle::after { content: " 닫기"; }` and remove motion when `prefers-reduced-motion: reduce` matches.

- [ ] **Step 4: Replace the always-expanded timeline and remove duplication**

In `app/page.tsx`, replace the current `experience` constant and timeline map with `getExperiences()` and `<ExperienceAccordion>`. Move field-engineering achievements into the relevant experience details and remove the standalone Field Engineering section.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- app/components/ExperienceAccordion.test.tsx && npm run lint && npm run build`
Expected: PASS.

```bash
git add app/components/ExperienceAccordion.tsx app/components/ExperienceAccordion.test.tsx app/page.tsx app/globals.css content/experience.json
git commit -m "feat: unify career history with expandable cards"
```

---

### Task 6: Connect the Unified Archive and Case Studies

**Files:**
- Modify: `app/archive.tsx`
- Modify: `app/page.tsx`
- Modify: `app/projects/[slug]/page.tsx`
- Modify: `content/projects/ai-elite-mis-rpa.md`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `CatalogProject[]`
- Archive navigation rule: `detailHref` uses internal `Link`; otherwise `githubUrl` uses external `<a>`

- [ ] **Step 1: Add an archive interaction test**

Create `app/archive.test.tsx` using Testing Library. Render one `데이터·AI` internal item and one `웹·도구` external item. Assert that choosing `웹·도구` hides the first item, shows the second, and that the second link has `target="_blank"`. Add a second assertion that an empty category renders `해당 분야의 공개 프로젝트가 없습니다.`.

- [ ] **Step 2: Run the test and verify current behavior fails**

Run: `npm test -- app/archive.test.tsx`
Expected: FAIL because the current archive assumes every entry has a project detail page and has no empty state.

- [ ] **Step 3: Update `ArchiveItem` and navigation behavior**

Replace the current props with:

```ts
export type ArchiveItem = {
  repoName: string; title: string; summary: string; category: string;
  stack: string; visibility: "PUBLIC" | "PRIVATE"; ongoing: boolean;
  detailHref: string | null; githubUrl: string | null; updatedAt: string | null;
};
```

Render internal items with `Link href={detailHref}`. Render GitHub-only items with `<a href={githubUrl} target="_blank" rel="noreferrer">`. Render non-clickable `<article>` only when both URLs are null. Keep `aria-live="polite"` on the result list.

- [ ] **Step 4: Use catalog categories and catalog rows on the home page**

Replace `getProjects()` and `getCategories()` usage in `app/page.tsx` with `getProjectCatalog()` and `getCatalogCategories()`. Keep Featured Projects sourced from Markdown case studies so every featured card has a detailed narrative.

- [ ] **Step 5: Normalize the MIS time metric in the case study**

In `content/projects/ai-elite-mis-rpa.md`:

- Change the cover caption from `연 약 154시간 절감` to `월 약 12.8시간 절감`.
- Change the result paragraph to `하루 37분, 연 250 영업일 기준 약 154시간이며 월평균으로 환산하면 약 12.8시간입니다.`
- Keep the annual calculation only as evidence, not as the headline metric.

- [ ] **Step 6: Normalize the detail-page section order**

Update `content/projects/_TEMPLATE.md` headings to: 문제 정의, 사용자와 현장 맥락, 제약 조건, 분석과 설계, 구현, 검증 결과, 본인의 역할, 배운 점과 다음 개선. Do not rewrite completed case-study facts in this task; map existing headings to the new order without inventing content.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- app/archive.test.tsx lib/catalog.test.ts && npm run lint && npm run build`
Expected: PASS; GitHub-only repositories appear in the static archive without generating invalid `/projects/<slug>/` routes.

```bash
git add app/archive.tsx app/archive.test.tsx app/page.tsx app/projects/[slug]/page.tsx content/projects/ai-elite-mis-rpa.md content/projects/_TEMPLATE.md app/globals.css
git commit -m "feat: connect full GitHub archive to curated case studies"
```

---

### Task 7: Automate Scheduled GitHub Pages Refresh

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `npm run sync:github`
- Produces: refreshed static `out/` artifact on push, manual dispatch, and schedule

- [ ] **Step 1: Add the daily trigger**

Set the workflow triggers to:

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: "17 18 * * *" # 매일 03:17 KST, GitHub 예약 실행은 지연될 수 있음
  workflow_dispatch:
```

- [ ] **Step 2: Run sync between dependency installation and build**

Add:

```yaml
      - name: Refresh public GitHub repository metadata
        run: npm run sync:github
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Keep `permissions.contents: read`, Pages write permission, basePath environment, `.nojekyll`, artifact upload, and deployment steps unchanged.

- [ ] **Step 3: Document the update paths**

Add a README section with exact operations:

```markdown
## 포트폴리오 내용 수정

- 사진: `public/profile.webp` 추가 후 `content/profile.json`의 `photoSrc`를 `/profile.webp`로 설정
- 이력서: `public/resume.pdf` 추가 후 `resumeHref`를 `/resume.pdf`로 설정
- 경력·교육: `content/experience.json` 수정
- 대표 성과: `content/profile.json`의 `metrics`, `impacts` 수정
- 대표 프로젝트·분류: `content/project-overrides.json` 수정
- 상세 사례: `content/projects/*.md` 수정
- GitHub 기본 정보: 저장소 설명·Topics 수정 후 Actions의 예약 실행 또는 수동 실행
```

Also document that GitHub Pages is static hosting, the token is used only during Actions, and API failure falls back to the last valid cache.

- [ ] **Step 4: Verify workflow syntax and production build**

Run:

```bash
npm run sync:github
npm test
npm run lint
NEXT_PUBLIC_BASE_PATH=/career-portfolio-web npm run build
test -f out/index.html
test -f out/projects/ai-elite-bems/index.html
```

Expected: every command exits 0.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml README.md content/generated/github-repos.json
git commit -m "ci: refresh GitHub portfolio metadata daily"
```

---

### Task 8: Responsive, Accessibility, and Deployment Verification

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `README.md`

**Interfaces:**
- Produces: verified static site at `/career-portfolio-web/`

- [ ] **Step 1: Add final metadata**

Set `app/layout.tsx` metadata to:

```ts
export const metadata = {
  title: "김종우 — 시스템 문제 해결형 엔지니어",
  description: "전자전기공학을 기반으로 제조 현장, 데이터·AI, 임베디드 시스템을 연결하는 김종우의 포트폴리오",
};
```

- [ ] **Step 2: Complete keyboard and motion styles**

Add a visible `:focus-visible` outline of `2px solid #2563EB` with `3px` offset to links, buttons, and summary elements. Under `@media (prefers-reduced-motion: reduce)`, set `scroll-behavior: auto`, remove transforms, and set animation duration to `0.01ms`.

- [ ] **Step 3: Inspect fixed viewport sizes**

Start: `npm run dev`
Inspect widths 360px, 768px, and 1440px. Verify:

- no horizontal scrollbar;
- profile crop stays 4:5;
- CTA buttons remain readable;
- metrics become 2 columns below 900px;
- experience summaries do not overlap the toggle;
- archive rows become stacked cards below 720px;
- project detail links retain `/career-portfolio-web` in the production export.

- [ ] **Step 4: Run the full local gate**

Run:

```bash
npm test
npm run lint
NEXT_PUBLIC_BASE_PATH=/career-portfolio-web npm run build
```

Expected: tests PASS, lint reports no errors, build completes static export.

- [ ] **Step 5: Push and verify GitHub Pages**

After user authorization, push the completed branch and wait for `Deploy to GitHub Pages` to succeed. Open `https://kjw413.github.io/career-portfolio-web/` and verify the home page, one internal project route, one GitHub-only archive link, and mobile layout.

- [ ] **Step 6: Commit verification notes**

Add the checked viewport widths, tested routes, and final command results to the README verification section, then commit:

```bash
git add app/globals.css app/layout.tsx README.md
git commit -m "docs: record portfolio verification results"
```

---

## Completion Criteria

- 첫 화면에 프로필 영역, 시스템 문제 해결형 엔지니어 문구, 월 단위 성과, 3개 CTA 구조가 있다.
- 사진과 이력서가 없어도 깨진 자산이나 임시 안내 문구가 보이지 않는다.
- 대표 성과, 대표 프로젝트, 전체 경험, 역량, 전체 저장소가 중복 없이 구분된다.
- 경험은 키보드로 펼칠 수 있고 주요 프로젝트는 상세 페이지로 이동한다.
- 공개 GitHub 저장소 전체가 예약 배포로 자동 갱신된다.
- 수동 제목·설명·분류·노출 순서가 GitHub 자동 정보보다 우선한다.
- API 실패 시 마지막 유효 캐시로 배포할 수 있다.
- GitHub Pages 정적 호스팅 이외의 서버 의존성이 없다.
- 테스트, 린트, 정적 빌드가 모두 통과한다.
