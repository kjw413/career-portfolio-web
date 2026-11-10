/**
 * 포트폴리오 빌더가 쓰는 데이터를 원장과 프로젝트 사례에서 만듭니다.
 *
 * 사실을 새로 적지 않습니다. 경험 카드·수치·소속·기본 이력은 전부 `content/ledger/`에서,
 * 프로젝트 사례는 `content/projects/`에서 읽어 "골라 실을 수 있는 모듈"로 모양만 맞춥니다.
 * 그래서 원장을 고치면 빌더와 PDF가 함께 따라옵니다.
 *
 * 빌드할 때만 도는 코드입니다(fs를 읽습니다). 브라우저에는 이 함수의 결과만 내려갑니다.
 */

import { marked } from "marked";
import skillsJson from "../content/skills.json";
import { getProjectCatalog } from "./catalog";
import { getProfile } from "./content";
import {
  fillMetrics,
  formatAffiliationPeriod,
  getAffiliations,
  getCardMetrics,
  getHeadlineMetrics,
  getPublicCards,
  getQualifications,
  getSelectionGuide,
} from "./ledger";
import type { JobGuide, SelectionItem } from "./portfolio-selection";
import { getFeaturedProjects, getProjects } from "./projects";

/** 공개 사이트의 주소. 로컬에서 빌드해도 문서 속 링크는 배포 주소를 가리킵니다. */
export const SITE_URL = `${process.env.SITE_ORIGIN ?? "https://kjw413.github.io"}${
  process.env.NEXT_PUBLIC_BASE_PATH || "/career-portfolio-web"
}`;

export type PortfolioMetric = {
  id: string;
  display: string;
  label: string;
  condition: string | null;
};

export type PortfolioModule = {
  /** 경험 카드는 `EXP-…`, 프로젝트 사례는 slug */
  id: string;
  kind: "experience" | "project";
  title: string;
  /** 빌더 목록에서 묶어 보여 줄 이름(소속 또는 "프로젝트") */
  group: string;
  role: string | null;
  period: string | null;
  ongoing: boolean;
  /** 원장의 확인 상태. 프로젝트 사례에는 없습니다. */
  status: string | null;
  excludeFor: string[];
  headline: string;
  highlights: string[];
  metrics: PortfolioMetric[];
  /** 팀 작업에서 본인이 맡은 범위. 있으면 요약에서도 항상 싣습니다. */
  teamContext: string | null;
  tags: string[];
  /** 상세로 실을 때만 쓰는 본문 */
  bodyHtml: string;
  cover: { src: string; caption: string | null } | null;
  /** 사이트의 근거 페이지. 추적 코드는 문서를 그릴 때 붙입니다. */
  links: { label: string; href: string }[];
};

export type PortfolioData = {
  siteUrl: string;
  person: { name: string; nameEn: string; email: string | null; githubUrl: string };
  role: string;
  summary: string;
  headlineMetrics: (PortfolioMetric & { cardIds: string[] })[];
  history: {
    id: string;
    kind: string;
    organization: string;
    role: string;
    period: string;
    /** 재직 중인 경력의 입사일. 재직기간은 문서를 만드는 날 기준으로 다시 계산합니다. */
    tenureFrom: string | null;
  }[];
  qualifications: { label: string; title: string; detail: string }[];
  skills: { title: string; skills: string[] }[];
  modules: PortfolioModule[];
  guides: JobGuide[];
  /** 주소에 구성이 없을 때 여는 기본 구성. 공개 PDF(public/portfolio.pdf)도 이 구성입니다. */
  defaultItems: SelectionItem[];
};

/**
 * 제출 문서에 싣지 않는 카드 본문의 절. 쓰는 사람에게 남긴 규칙과 미확정 기록이라
 * 사이트의 경험 카드에는 그대로 보이지만, 회사에 내는 문서에는 넣지 않습니다.
 */
export const WRITER_SECTIONS = ["작성 메모", "확인이 필요한 것"];

/** `## 제목` 단위로 나눠, 쓰는 사람용 절을 걷어 냅니다. */
export function stripWriterSections(markdown: string): string {
  return markdown
    .split(/^(?=## )/m)
    .filter((section) => {
      const title = /^## +(.+?)\s*$/m.exec(section)?.[1] ?? "";
      return !WRITER_SECTIONS.includes(title);
    })
    .join("")
    .trimEnd();
}

function formatCardPeriod(period: { start: string | null; end: string | null }): string | null {
  if (!period.start) return null;
  const format = (value: string) => value.slice(0, 7).replace("-", ".");
  return period.end
    ? `${format(period.start)} ~ ${format(period.end)}`
    : `${format(period.start)} ~ 진행 중`;
}

export function getPortfolioData(): PortfolioData {
  const profile = getProfile();
  const cards = getPublicCards();
  const projects = getProjects();
  const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
  const affiliations = getAffiliations();
  const organizationOf = new Map(affiliations.map((item) => [item.id, item.organization]));

  const experienceModules: PortfolioModule[] = cards.map((card) => {
    const linked = card.projectSlugs
      .map((slug) => projectBySlug.get(slug))
      .filter((project): project is NonNullable<typeof project> => project !== undefined);
    const cover = linked.find((project) => project.cover)?.cover ?? null;

    return {
      id: card.id,
      kind: "experience",
      title: card.title,
      group: organizationOf.get(card.affiliation) ?? card.affiliation,
      role: card.role,
      period: formatCardPeriod(card.period),
      ongoing: card.status === "진행중",
      status: card.status,
      excludeFor: card.excludeFor,
      headline: fillMetrics(card.headline),
      highlights: card.highlights.map(fillMetrics),
      metrics: getCardMetrics(card).map((metric) => ({
        id: metric.id,
        display: metric.display,
        label: metric.label,
        condition: metric.condition ?? null,
      })),
      teamContext: card.teamContext,
      tags: card.tags,
      bodyHtml: marked.parse(fillMetrics(stripWriterSections(card.body))) as string,
      cover: cover ? { src: cover.src, caption: cover.caption } : null,
      links: [
        { label: "수치의 산출 조건과 근거", href: `${SITE_URL}/experience/${card.id}/` },
        ...linked.map((project) => ({
          label: `${project.title} 사례`,
          href: `${SITE_URL}/projects/${project.slug}/`,
        })),
      ],
    };
  });

  // 경험 카드가 이미 가리키는 사례는 그 카드에 붙어 나갑니다. 따로 고르는 것은 카드가 없는 사례뿐입니다.
  const covered = new Set(cards.flatMap((card) => card.projectSlugs));
  const projectModules: PortfolioModule[] = projects
    .filter((project) => !covered.has(project.slug))
    .map((project) => ({
      id: project.slug,
      kind: "project",
      title: project.title,
      group: "프로젝트",
      role: project.kind,
      period: project.period,
      ongoing: project.status === "ongoing",
      status: null,
      excludeFor: [],
      headline: project.intro,
      highlights: [],
      metrics: [],
      teamContext: null,
      tags: project.tags,
      bodyHtml: project.bodyHtml,
      cover: project.cover ? { src: project.cover.src, caption: project.cover.caption } : null,
      links: [
        { label: "프로젝트 사례", href: `${SITE_URL}/projects/${project.slug}/` },
        ...(project.github && project.visibility === "PUBLIC"
          ? [{ label: "GitHub 저장소", href: project.github }]
          : []),
      ],
    }));

  const modules = [...experienceModules, ...projectModules];
  const available = new Set(modules.map((entry) => entry.id));

  /*
   * 기본 구성은 새로 정하지 않고 홈 화면의 선택을 따릅니다:
   * 주요 성과의 경험 카드는 상세로, 대표 프로젝트 가운데 카드가 없는 사례는 요약으로.
   */
  const defaultItems: SelectionItem[] = [];
  for (const impact of profile.impacts) {
    if (impact.cardId && available.has(impact.cardId)) {
      defaultItems.push({ id: impact.cardId, level: "detail" });
    }
  }
  for (const project of getFeaturedProjects(getProjectCatalog())) {
    if (!covered.has(project.slug) && available.has(project.slug)) {
      defaultItems.push({ id: project.slug, level: "summary" });
    }
  }

  return {
    siteUrl: SITE_URL,
    person: {
      name: profile.name,
      nameEn: profile.nameEn,
      email: profile.emailHref?.replace(/^mailto:/, "") ?? null,
      githubUrl: profile.githubUrl,
    },
    role: profile.role,
    summary: profile.summary,
    headlineMetrics: getHeadlineMetrics(profile.headlineMetricIds).map((metric) => ({
      id: metric.id,
      display: metric.display,
      label: metric.label,
      condition: metric.condition ?? null,
      cardIds: metric.cardIds,
    })),
    // 학력과 병역은 아래 기본 이력표에 있으므로, 여기에는 경력과 교육 과정만 둡니다.
    history: affiliations
      .filter((item) => item.showInTimeline && (item.kind === "career" || item.kind === "education"))
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        organization: item.organization,
        role: item.role,
        period: formatAffiliationPeriod(item),
        tenureFrom: item.kind === "career" && !item.end ? item.start : null,
      })),
    qualifications: getQualifications(),
    skills: skillsJson.map((group) => ({ title: group.title, skills: group.skills })),
    modules,
    guides: getSelectionGuide(),
    defaultItems,
  };
}
