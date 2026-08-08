import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export type ProjectStatus = "ongoing" | "completed";

export type Media = {
  src: string;
  caption: string | null;
  /** 세로로 긴 이미지(전체 화면 캡처 등)를 원본 비율로 보여줄지 */
  tall: boolean;
};

export type Project = {
  slug: string;
  /** 한글 표시 제목 (featured 카드·상세 페이지) */
  title: string;
  /** GitHub 저장소명 그대로 (아카이브 목록 표시) */
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
  /** SELECTED WORK 노출 순서 (없으면 미노출) */
  featured: number | null;
  /** 아카이브 목록 정렬 순서 */
  order: number;
  /** 대표 이미지 — 카드 썸네일과 상세 페이지 상단에 사용 */
  cover: Media | null;
  /** 상세 페이지 하단 스크린샷·GIF 갤러리 */
  gallery: Media[];
  /** 마크다운 본문을 렌더링한 HTML */
  bodyHtml: string;
};

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

/** `"/projects/a.png"` 또는 `{ src, caption, tall }` 두 형태를 모두 받는다. */
function toMedia(value: unknown): Media | null {
  if (typeof value === "string") {
    const src = toStringOrNull(value);
    return src ? { src: withBasePath(src), caption: null, tall: false } : null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const src = toStringOrNull(record.src);
    if (!src) return null;
    return {
      src: withBasePath(src),
      caption: toStringOrNull(record.caption),
      tall: record.tall === true,
    };
  }
  return null;
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
    cover: toMedia(data.cover),
    gallery: toGallery(data.gallery),
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

export function getProject(slug: string): Project | null {
  return getProjects().find((project) => project.slug === slug) ?? null;
}

export function getFeaturedProjects(): Project[] {
  return getProjects()
    .filter((project) => project.featured !== null)
    .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));
}

/** 아카이브 필터 목록: ALL + 데이터에 존재하는 카테고리 (order 순) */
export function getCategories(): string[] {
  const seen: string[] = [];
  for (const project of getProjects()) {
    if (!seen.includes(project.category)) seen.push(project.category);
  }
  return ["ALL", ...seen];
}
