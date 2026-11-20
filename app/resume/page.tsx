import type { Metadata } from "next";
import skills from "../../content/skills.json";
import { getProjectCatalog } from "../../lib/catalog";
import { getProfile } from "../../lib/content";
import {
  getHeadlineMetrics,
  getQualifications,
  getTimeline,
  type TimelineItem,
} from "../../lib/ledger";
import { getFeaturedProjects } from "../../lib/projects";

/*
 * 이력서 PDF(public/portfolio.pdf)의 원본 페이지입니다. `npm run pdf`가 이 페이지를 A4로
 * 인쇄해 PDF를 만듭니다. 내용은 사이트와 같은 원장·프로필·프로젝트에서 읽으므로, 사실을
 * 고치면 다음 PDF에 그대로 반영됩니다. 여기에 문장이나 수치를 직접 적지 않습니다.
 */

export const metadata: Metadata = {
  title: "김종우 — 경력 요약",
  description: "김종우의 경력·프로젝트·보유 기술을 A4 두 쪽으로 요약한 이력서 원본 페이지",
  robots: { index: false },
};

const SITE = "kjw413.github.io/career-portfolio-web";

/** 경험 카드 headline의 " — " 뒤(결과)만 씁니다. 제목은 따로 굵게 둡니다. */
function resultOf(item: TimelineItem): string {
  const parts = item.headline.split(" — ");
  return parts.length > 1 ? parts.slice(1).join(" — ") : item.headline;
}

/** 한 시기에서 이력서에 올릴 항목. 확인이 끝난 일을 먼저, 시기마다 정한 개수까지만. */
function pick(items: TimelineItem[], limit: number): TimelineItem[] {
  return items.filter((item) => item.status === "확정" || item.status === "진행중").slice(0, limit);
}

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

export default function ResumePage() {
  const profile = getProfile();
  const metrics = getHeadlineMetrics(profile.headlineMetricIds);
  const timeline = getTimeline();
  const careers = timeline.filter((entry) => entry.kind === "career");
  const education = timeline.filter((entry) => entry.kind === "education");
  const qualifications = getQualifications();
  const projects = getFeaturedProjects(getProjectCatalog());
  const email = profile.emailHref?.replace(/^mailto:/, "") ?? null;

  return (
    <main className="resume">
      <article className="resume-sheet">
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
            <li>{SITE}</li>
          </ul>
        </header>

        <p className="resume-summary">{profile.summary}</p>

        <dl className="resume-metrics">
          {metrics.map((metric) => (
            <div key={metric.id}>
              <dt>{metric.display}</dt>
              <dd>{metric.label}</dd>
            </div>
          ))}
        </dl>

        <section className="resume-section">
          <h2>경력</h2>
          <div>
            {careers.map((entry) => {
              const items = pick(entry.items, 7);
              return (
                <div className="resume-entry" key={entry.id}>
                  <p className="resume-entry-head">
                    <strong>{entry.organization}</strong>
                    <span>{entry.period}</span>
                  </p>
                  <p className="resume-entry-role">{entry.role}</p>
                  {items.length > 0 ? (
                    <ul className="resume-items">
                      {items.map((item) => (
                        <li key={item.cardId}>
                          <b>{item.title}</b> — {resultOf(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="resume-entry-text">{entry.summary}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="resume-section">
          <h2>교육</h2>
          <div>
            {education.map((entry) => (
              <div className="resume-entry" key={entry.id}>
                <p className="resume-entry-head">
                  <strong>{entry.organization}</strong>
                  <span>{entry.period}</span>
                </p>
                <p className="resume-entry-role">{entry.role}</p>
                <p className="resume-entry-text">{entry.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-section">
          <h2>학력 · 자격 · 병역</h2>
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

        <section className="resume-section resume-break">
          <h2>대표 프로젝트</h2>
          <div>
            {projects.map((project) => (
              <div className="resume-entry resume-project" key={project.slug}>
                <p className="resume-entry-head">
                  <strong>{project.title}</strong>
                  {project.period && <span>{project.period}</span>}
                </p>
                <p className="resume-entry-text">{project.intro}</p>
                <p className="resume-project-meta">
                  <span>{project.stack ?? project.tags.join(" · ")}</span>
                  <span>
                    {SITE}/projects/{project.slug}/
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-section">
          <h2>보유 기술</h2>
          <dl className="resume-skills">
            {skills.map((group) => (
              <div key={group.index}>
                <dt>{group.title}</dt>
                <dd>{group.skills.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 사이트 공통 footer 스타일(어두운 띠)이 붙지 않도록 footer 요소를 쓰지 않습니다. */}
        <p className="resume-foot">
          <span>모든 수치의 산출 조건과 확인 근거는 {SITE}/experience/ 의 경험 카드에 있습니다.</span>
          <span>갱신 {today()}</span>
        </p>
      </article>
    </main>
  );
}
