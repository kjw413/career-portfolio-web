import githubRepoCache from "../content/generated/github-repos.json";
import { getProjectOverrides, type ProjectOverride } from "./content";
import { getProjectSummaries, type ProjectSummary } from "./projects";

export type GithubRepo = {
  name: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  topics: string[];
  updatedAt: string;
  stars: number;
  archived: boolean;
  fork: boolean;
};

type CatalogCategory = "제조·자동화" | "데이터·AI" | "임베디드" | "웹·도구";

const CATALOG_CATEGORIES: CatalogCategory[] = [
  "제조·자동화",
  "데이터·AI",
  "임베디드",
  "웹·도구",
];

export type CatalogProject = {
  repoName: string;
  title: string;
  summary: string;
  category: CatalogCategory;
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

const CATEGORY_TOPICS = {
  "제조·자동화": ["manufacturing", "automation", "rpa", "bems", "fems"],
  "데이터·AI": ["ai", "ml", "data", "forecasting", "llm"],
  "임베디드": ["embedded", "can", "spi", "freertos", "opencv"],
} as const;

const LEGACY_CATEGORIES: Record<string, CatalogCategory> = {
  "AI · DATA": "데이터·AI",
  AUTOMATION: "제조·자동화",
  EMBEDDED: "임베디드",
  SOFTWARE: "웹·도구",
};

function getCategoryFromTopics(topics: string[]): CatalogCategory {
  const normalizedTopics = topics.map((topic) => topic.toLowerCase());
  for (const [category, categoryTopics] of Object.entries(CATEGORY_TOPICS)) {
    if (categoryTopics.some((topic) => normalizedTopics.includes(topic))) {
      return category as CatalogCategory;
    }
  }
  return "웹·도구";
}

function getCategory(category: string | undefined, topics: string[]): CatalogCategory {
  if (category === "제조·자동화" || category === "데이터·AI" || category === "임베디드" || category === "웹·도구") {
    return category;
  }
  return category ? LEGACY_CATEGORIES[category] ?? getCategoryFromTopics(topics) : getCategoryFromTopics(topics);
}

function getGithubStack(repo: GithubRepo | undefined): string {
  if (!repo) return "";
  return [repo.language, ...repo.topics].filter((value): value is string => Boolean(value)).join(" · ");
}

function getVisibility(project: ProjectSummary | undefined): "PUBLIC" | "PRIVATE" {
  return project?.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

export function mergeCatalog(
  githubRepos: GithubRepo[],
  markdownProjects: ProjectSummary[],
  overrides: ProjectOverride[],
): CatalogProject[] {
  const githubByRepo = new Map(githubRepos.map((repo) => [repo.name, repo]));
  const markdownByRepo = new Map(markdownProjects.map((project) => [project.repoName, project]));
  const overridesByRepo = new Map(overrides.map((override) => [override.repoName, override]));
  const repoNames = new Set([
    ...githubByRepo.keys(),
    ...markdownByRepo.keys(),
    ...overridesByRepo.keys(),
  ]);

  return [...repoNames]
    .filter((repoName) => overridesByRepo.get(repoName)?.included !== false)
    .map((repoName) => {
      const github = githubByRepo.get(repoName);
      const markdown = markdownByRepo.get(repoName);
      const override = overridesByRepo.get(repoName);

      return {
        repoName,
        title: override?.title ?? markdown?.title ?? github?.name ?? repoName,
        summary: override?.summary ?? markdown?.summary ?? github?.description ?? "설명이 등록되지 않은 공개 저장소입니다.",
        category: getCategory(override?.category ?? markdown?.category, github?.topics ?? []),
        stack: markdown?.stack ?? getGithubStack(github),
        githubUrl: markdown?.github ?? github?.htmlUrl ?? null,
        detailHref: markdown ? `/projects/${markdown.slug}/` : null,
        visibility: getVisibility(markdown),
        ongoing: markdown?.status === "ongoing",
        featured: override?.featured ?? markdown?.featured ?? null,
        order: override?.order ?? markdown?.order ?? 999,
        updatedAt: github?.updatedAt ?? null,
        stars: github?.stars ?? 0,
      };
    })
    .sort((a, b) => {
      const featuredDifference = (a.featured ?? Number.MAX_SAFE_INTEGER) - (b.featured ?? Number.MAX_SAFE_INTEGER);
      if (featuredDifference !== 0) return featuredDifference;

      const orderDifference = a.order - b.order;
      if (orderDifference !== 0) return orderDifference;

      const updatedAtDifference = (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      if (updatedAtDifference !== 0) return updatedAtDifference;

      return a.repoName.localeCompare(b.repoName);
    });
}

export function getProjectCatalog(): CatalogProject[] {
  return mergeCatalog(
    githubRepoCache.repos as GithubRepo[],
    getProjectSummaries(),
    getProjectOverrides(),
  );
}

export function getCatalogCategories(): string[] {
  return [...CATALOG_CATEGORIES];
}
