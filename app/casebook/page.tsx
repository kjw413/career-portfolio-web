import type { Metadata } from "next";
import QRCode from "qrcode";
import { getProjectCatalog } from "../../lib/catalog";
import { getProfile } from "../../lib/content";
import {
  fillMetrics,
  getHeadlineMetrics,
  getMetric,
  getQualifications,
  getTimeline,
} from "../../lib/ledger";
import { getCatalogProjects, withBasePath, type Project } from "../../lib/projects";
import { CasebookBuilder, type CasebookCoverView, type CasebookProjectView } from "./CasebookBuilder";

/*
 * 포트폴리오 PDF의 원본 페이지입니다.
 *
 * - 화면에서는 넣을 프로젝트와 1쪽 구성을 골라 브라우저 인쇄로 PDF를 만듭니다(CasebookBuilder).
 * - `npm run pdf`는 기본 구성(대표 프로젝트, 모든 항목)을 public/portfolio-cases.pdf로 인쇄하고,
 *   모든 프로젝트를 넣은 최대 구성도 한 번 인쇄해 쪽 넘침과 2MB 한도를 확인합니다. 그 결과를
 *   public/portfolio-cases.meta.json에 남기고, 이 페이지가 읽어 예상 용량으로 보여 줍니다.
 *
 * 지원 직무는 적지 않습니다 — 같은 파일을 여러 회사에 냅니다. 사이트는 공개이므로 사진·나이 같은
 * 개인정보는 넣지 않습니다(CLAUDE.md 4절).
 *
 * 프로젝트 쪽의 문장은 각 content/projects/*.md의 casebook 항목에서, 수치는 원장에서 읽습니다.
 * casebook이 없는 프로젝트는 고를 수 없습니다.
 */

export const metadata: Metadata = {
  // 브라우저의 'PDF로 저장'이 이 제목을 기본 파일 이름으로 씁니다.
  title: "김종우_포트폴리오",
  description: "넣을 프로젝트와 1쪽 구성을 골라 A4 포트폴리오 PDF로 저장하는 페이지",
  robots: { index: false },
};

const SITE_URL = "https://kjw413.github.io/career-portfolio-web/";
const SITE = SITE_URL.replace(/^https:\/\//, "").replace(/\/$/, "");

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

/** 결과로 싣는 수치는 확정된 것만 씁니다. 미확정 수치가 PDF로 나가지 않게 빌드를 멈춥니다. */
function toView(project: Project): CasebookProjectView | null {
  const casebook = project.casebook;
  if (!casebook) return null;
  const metrics = casebook.metricIds.map((id) => {
    const metric = getMetric(id);
    if (metric.status !== "확정") {
      throw new Error(`${project.slug}: casebook 수치 ${id}의 상태가 ${metric.status}입니다. 확정된 수치만 씁니다.`);
    }
    return { id, display: metric.display, label: metric.label, condition: metric.condition ?? null };
  });
  return {
    slug: project.slug,
    title: project.title,
    kind: project.kind,
    period: project.period ?? null,
    summary: project.summary,
    stack: project.stack || null,
    role: casebook.role,
    problem: fillMetrics(casebook.problem),
    approach: casebook.approach.map((line) => fillMetrics(line)),
    metrics,
    note: casebook.note ? fillMetrics(casebook.note) : null,
    image: casebook.image ? { src: casebook.image.src, caption: casebook.image.caption ?? null } : null,
    featured: project.featured !== null,
  };
}

export default async function CasebookPage() {
  const profile = getProfile();
  const timeline = getTimeline();
  const rows = (kind: string) =>
    timeline
      .filter((entry) => entry.kind === kind)
      .map((entry) => ({ id: entry.id, organization: entry.organization, role: entry.role, period: entry.period }));

  const cover: CasebookCoverView = {
    name: profile.name,
    nameEn: profile.nameEn,
    tagline: profile.role,
    summary: profile.summary,
    email: profile.emailHref?.replace(/^mailto:/, "") ?? null,
    github: profile.githubUrl.replace(/^https?:\/\//, ""),
    headline: getHeadlineMetrics(profile.headlineMetricIds).map((metric) => ({
      id: metric.id,
      display: metric.display,
      label: metric.label,
    })),
    careers: rows("career"),
    education: rows("education"),
    qualifications: getQualifications().map((item) => ({
      label: item.label,
      title: item.title,
      detail: item.detail,
    })),
    qrSvg: await QRCode.toString(SITE_URL, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#0d1526", light: "#0000" },
    }),
    site: SITE,
    updated: today(),
  };

  const projects = getCatalogProjects(getProjectCatalog())
    .map(toView)
    .filter((project): project is CasebookProjectView => project !== null);

  return (
    <main className="resume">
      <CasebookBuilder
        cover={cover}
        projects={projects}
        metaHref={withBasePath("/portfolio-cases.meta.json")}
        downloadHref={profile.casebookHref ? withBasePath(profile.casebookHref) : null}
      />
    </main>
  );
}
