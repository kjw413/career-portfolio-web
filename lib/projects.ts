import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { CatalogProject } from "./catalog";

export type ProjectStatus = "ongoing" | "completed";

export type Media = {
  src: string;
  caption: string | null;
  /** 세로로 긴 이미지(전체 화면 캡처 등)를 원본 비율로 보여줄지 */
  tall: boolean;
};

export type Project = {
  slug: string;
  /** 상세 사례 제목. 카탈로그 override가 없을 때 표시 제목으로도 사용 */
  title: string;
  /** GitHub·override·Markdown 상세 사례를 연결하는 저장소명 키 */
  repoName: string;
  category: string;
  /** featured 카드 상단 라벨 (예: "AI · DATA · WEB") */
  kind: string;
  /** 짧은 설명 (아카이브 목록) */
  summary: string;
  /** 긴 소개 (featured 카드·상세 페이지 리드문, 없으면 summary 사용) */
  intro: string;
  period: string | null;
  tags: string[];
  stack: string | null;
  github: string | null;
  visibility: string;
  status: ProjectStatus;
  /** 카탈로그 override가 없을 때 사용하는 대표 노출 순서 */
  featured: number | null;
  /** 카탈로그 override가 없을 때 사용하는 아카이브 정렬 순서 */
  order: number;
  /** 대표 이미지 — 카드 썸네일과 상세 페이지 상단에 사용 */
  cover: Media | null;
  /** 상세 페이지 하단 스크린샷·GIF 갤러리 */
  gallery: Media[];
  /** 마크다운 본문을 렌더링한 HTML */
  bodyHtml: string;
};

export type ProjectSummary = Omit<
  Project,
  "bodyHtml" | "cover" | "gallery" | "tags" | "intro" | "kind" | "period"
>;

const CONTENT_DIR = path.join(process.cwd(), "content", "projects");

// GitHub Pages는 /career-portfolio-web 하위에서 서빙되므로, 마크다운 본문과
// frontmatter에 적힌 루트 경로(/projects/...)에 basePath를 붙여야 한다.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(src: string): string {
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  return `${BASE_PATH}${src}`;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * 아직 올리지 않은 이미지는 깨진 채로 노출하지 않고 조용히 건너뛴다.
 * public/ 에 파일을 올리면 다음 빌드에서 자동으로 나타난다.
 */
function mediaExists(src: string): boolean {
  if (!src.startsWith("/") || src.startsWith("//")) return true; // 외부 URL은 검사하지 않음
  return fs.existsSync(path.join(PUBLIC_DIR, src.replace(/^\//, "")));
}

/** `"/projects/a.png"` 또는 `{ src, caption, tall }` 두 형태를 모두 받는다. */
function toMedia(value: unknown): Media | null {
  let src: string | null = null;
  let caption: string | null = null;
  let tall = false;

  if (typeof value === "string") {
    src = toStringOrNull(value);
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    src = toStringOrNull(record.src);
    caption = toStringOrNull(record.caption);
    tall = record.tall === true;
  }

  if (!src || !mediaExists(src)) return null;
  return { src: withBasePath(src), caption, tall };
}

function toGallery(value: unknown): Media[] {
  if (!Array.isArray(value)) return [];
  return value.map(toMedia).filter((item): item is Media => item !== null);
}

/** 마크다운 본문 안의 루트 경로 이미지에도 basePath를 적용한다. */
function renderMarkdown(content: string): string {
  const renderer = new marked.Renderer();
  const baseImage = renderer.image.bind(renderer);
  renderer.image = (token) =>
    baseImage({ ...token, href: withBasePath(token.href) });
  return marked.parse(content, { renderer }) as string;
}

function parseProject(fileName: string): Project {
  const slug = fileName.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(CONTENT_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  const repoName = toStringOrNull(data.repoName);
  const title = toStringOrNull(data.title) ?? repoName;
  const category = toStringOrNull(data.category);
  const summary = toStringOrNull(data.summary);
  if (!title || !category || !summary) {
    throw new Error(
      `content/projects/${fileName}: title(또는 repoName), category, summary는 필수입니다.`,
    );
  }

  const stack = toStringOrNull(data.stack);
  const tags = Array.isArray(data.tags)
    ? data.tags.map(String)
    : (stack?.split("·").map((s) => s.trim()) ?? []);

  // 지정한 대표 이미지가 아직 없으면 갤러리의 첫 자료로 대신한다.
  let cover = toMedia(data.cover);
  let gallery = toGallery(data.gallery);
  if (!cover && gallery.length > 0) {
    cover = gallery[0];
    gallery = gallery.slice(1);
  }
  // 대표 이미지와 같은 파일이 갤러리에 또 있으면 한 번만 보여준다.
  if (cover) {
    const coverSrc = cover.src;
    gallery = gallery.filter((item) => item.src !== coverSrc);
  }

  return {
    slug,
    title,
    repoName: repoName ?? title,
    category,
    kind: toStringOrNull(data.kind) ?? category,
    summary,
    intro: toStringOrNull(data.intro) ?? summary,
    period: toStringOrNull(data.period),
    tags,
    stack,
    github: toStringOrNull(data.github),
    visibility: toStringOrNull(data.visibility) ?? "PUBLIC",
    status: data.status === "ongoing" ? "ongoing" : "completed",
    featured: typeof data.featured === "number" ? data.featured : null,
    order: typeof data.order === "number" ? data.order : 999,
    cover,
    gallery,
    bodyHtml: renderMarkdown(content),
  };
}

export function getProjects(): Project[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map(parseProject)
    .sort((a, b) => a.order - b.order);
}

export function getProjectSummaries(): ProjectSummary[] {
  return getProjects().map((project) => ({
    slug: project.slug,
    title: project.title,
    repoName: project.repoName,
    category: project.category,
    summary: project.summary,
    stack: project.stack,
    github: project.github,
    visibility: project.visibility,
    status: project.status,
    featured: project.featured,
    order: project.order,
  }));
}

export function getProject(slug: string): Project | null {
  return getProjects().find((project) => project.slug === slug) ?? null;
}

export function getFeaturedProjects(catalog: CatalogProject[]): Project[] {
  const detailsByRepo = new Map(
    getProjects().map((project) => [project.repoName, project]),
  );

  return catalog
    .filter((project) => project.featured !== null && project.detailHref !== null)
    .map((catalogProject): Project | null => {
      const details = detailsByRepo.get(catalogProject.repoName);
      if (!details) return null;

      return {
        ...details,
        title: catalogProject.title,
        category: catalogProject.category,
        summary: catalogProject.summary,
        featured: catalogProject.featured,
        order: catalogProject.order,
      };
    })
    .filter((project): project is Project => project !== null);
}

/** 아카이브 필터 목록: ALL + 데이터에 존재하는 카테고리 (order 순) */
export function getCategories(): string[] {
  const seen: string[] = [];
  for (const project of getProjects()) {
    if (!seen.includes(project.category)) seen.push(project.category);
  }
  return ["ALL", ...seen];
}
