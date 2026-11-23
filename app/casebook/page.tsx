import type { Metadata } from "next";
import QRCode from "qrcode";
import { getProjectCatalog } from "../../lib/catalog";
import { getProfile } from "../../lib/content";
import {
  getHeadlineMetrics,
  getMetric,
  getQualifications,
  getTimeline,
  fillMetrics,
} from "../../lib/ledger";
import { getFeaturedProjects, type Project } from "../../lib/projects";

/*
 * 포트폴리오 PDF(public/portfolio-cases.pdf)의 원본 페이지입니다. `npm run pdf`가 이 페이지를
 * A4로 인쇄합니다. 1쪽은 기본 정보와 웹 포트폴리오 링크, 2쪽부터 대표 프로젝트를 한 쪽씩
 * 싣습니다. 지원 직무는 적지 않습니다 — 같은 파일을 여러 회사에 냅니다.
 *
 * 사이트는 공개이므로 사진·나이 같은 개인정보는 넣지 않습니다(CLAUDE.md 4절). 필요한 회사에는
 * 지원서 입력란이나 비공개 사본으로 따로 냅니다.
 *
 * 프로젝트 쪽의 문장은 각 content/projects/*.md의 casebook 항목에서, 수치는 원장에서 읽습니다.
 */

export const metadata: Metadata = {
  title: "김종우 — 포트폴리오",
  description: "김종우의 기본 정보와 대표 프로젝트 사례를 A4로 정리한 포트폴리오 원본 페이지",
  robots: { index: false },
};

const SITE_URL = "https://kjw413.github.io/career-portfolio-web/";
const SITE = SITE_URL.replace(/^https:\/\//, "").replace(/\/$/, "");

function pageNo(value: number): string {
  return String(value).padStart(2, "0");
}

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

/** 결과로 싣는 수치는 확정된 것만 씁니다. 미확정 수치가 PDF로 나가지 않게 빌드를 멈춥니다. */
function resultMetrics(project: Project) {
  return (project.casebook?.metricIds ?? []).map((id) => {
    const metric = getMetric(id);
    if (metric.status !== "확정") {
      throw new Error(`${project.slug}: casebook 수치 ${id}의 상태가 ${metric.status}입니다. 확정된 수치만 씁니다.`);
    }
    return { id, ...metric };
  });
}

export default async function CasebookPage() {
  const profile = getProfile();
  const headline = getHeadlineMetrics(profile.headlineMetricIds);
  const timeline = getTimeline();
  const careers = timeline.filter((entry) => entry.kind === "career");
  const education = timeline.filter((entry) => entry.kind === "education");
  const qualifications = getQualifications();
  const projects = getFeaturedProjects(getProjectCatalog()).filter((project) => project.casebook);
  const email = profile.emailHref?.replace(/^mailto:/, "") ?? null;
  const qr = await QRCode.toString(SITE_URL, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0d1526", light: "#0000" },
  });

  return (
    <main className="resume casebook">
      <article className="resume-sheet cb-page cb-cover">
        <header className="resume-head">
          <div>
            <p className="resume-name">
              {profile.name}
              <span>{profile.nameEn}</span>
            </p>
            <h1>{profile.role}</h1>
          </div>
          <ul className="resume-contact">
            {email && <li>{email}</li>}
            <li>{profile.githubUrl.replace(/^https?:\/\//, "")}</li>
          </ul>
        </header>

        <p className="resume-summary">{profile.summary}</p>

        <dl className="resume-metrics">
          {headline.map((metric) => (
            <div key={metric.id}>
              <dt>{metric.display}</dt>
              <dd>{metric.label}</dd>
            </div>
          ))}
        </dl>

        <section className="resume-section">
          <h2>경력</h2>
          <div className="cb-rows">
            {careers.map((entry) => (
              <p className="cb-row" key={entry.id}>
                <strong>{entry.organization}</strong>
                <span>{entry.role}</span>
                <time>{entry.period}</time>
              </p>
            ))}
          </div>
        </section>

        <section className="resume-section">
          <h2>교육</h2>
          <div className="cb-rows">
            {education.map((entry) => (
              <p className="cb-row" key={entry.id}>
                <strong>{entry.organization}</strong>
                <span>{entry.role}</span>
                <time>{entry.period}</time>
              </p>
            ))}
          </div>
        </section>

        <section className="resume-section">
          <h2>학력 · 자격</h2>
          <dl className="resume-facts">
            {qualifications.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="resume-section">
          <h2>수록 사례</h2>
          <ol className="cb-toc">
            {projects.map((project, index) => (
              <li key={project.slug}>
                <span className="cb-toc-no">{pageNo(index + 2)}</span>
                <strong>{project.title}</strong>
                <span className="cb-toc-text">{project.summary}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="cb-link">
          <div className="cb-qr" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden="true" />
          <div>
            <p className="cb-link-label">웹 포트폴리오</p>
            <p className="cb-link-url">{SITE}</p>
            <p className="cb-link-text">
              전체 프로젝트, 화면 갤러리, 모든 수치의 산출 조건과 확인 근거를 볼 수 있습니다.
            </p>
          </div>
        </aside>

        <p className="resume-foot cb-foot">
          <span>
            {profile.name} 포트폴리오 · 갱신 {today()}
          </span>
          <span>01</span>
        </p>
      </article>

      {projects.map((project, index) => {
        const casebook = project.casebook!;
        const metrics = resultMetrics(project);
        return (
          <article className="resume-sheet cb-page cb-project" key={project.slug}>
            <p className="cb-eyebrow">
              <span>
                PROJECT {pageNo(index + 1)} · {project.kind}
              </span>
              {project.period && <span>{project.period}</span>}
            </p>
            <h2 className="cb-title">{project.title}</h2>
            <p className="cb-summary">{project.summary}</p>
            <dl className="cb-meta">
              <div>
                <dt>역할</dt>
                <dd>{casebook.role}</dd>
              </div>
              {project.stack && (
                <div>
                  <dt>기술</dt>
                  <dd>{project.stack}</dd>
                </div>
              )}
            </dl>

            {casebook.image && (
              <figure className="cb-figure">
                {/* eslint-disable-next-line @next/next/no-img-element -- 인쇄용 정적 페이지 */}
                <img src={casebook.image.src} alt={casebook.image.caption ?? ""} />
                {casebook.image.caption && <figcaption>{casebook.image.caption}</figcaption>}
              </figure>
            )}

            <div className="cb-body">
              <div>
                <h3>문제</h3>
                <p>{fillMetrics(casebook.problem)}</p>
                <h3>한 일</h3>
                <ul className="resume-items">
                  {casebook.approach.map((line) => (
                    <li key={line}>{fillMetrics(line)}</li>
                  ))}
                </ul>
              </div>
              <div className="cb-results">
                <h3>결과</h3>
                <dl>
                  {metrics.map((metric) => (
                    <div key={metric.id}>
                      <dt>{metric.display}</dt>
                      <dd>
                        {metric.label}
                        {metric.condition && <span>{metric.condition}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                {casebook.note && <p className="cb-note">{fillMetrics(casebook.note)}</p>}
              </div>
            </div>

            <p className="resume-foot cb-foot">
              <span>
                상세 사례 {SITE}/projects/{project.slug}/
              </span>
              <span>{pageNo(index + 2)}</span>
            </p>
          </article>
        );
      })}
    </main>
  );
}
