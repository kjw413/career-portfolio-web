import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fillMetrics,
  getCard,
  getCardMetrics,
  getPublicCards,
  renderCardBody,
} from "../../../lib/ledger";
import { getProject } from "../../../lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicCards().map((card) => ({ id: card.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const card = getCard(id);
  if (!card) return {};
  return {
    title: `${card.title} — 김종우 포트폴리오`,
    description: fillMetrics(card.headline),
  };
}

function formatPeriod(period: { start: string | null; end: string | null }): string | null {
  if (!period.start) return null;
  const format = (value: string) => value.slice(0, 7).replace("-", ".");
  return period.end
    ? `${format(period.start)} ~ ${format(period.end)}`
    : `${format(period.start)} ~ 진행 중`;
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCard(id);
  if (!card || !card.publicOnSite) notFound();

  const period = formatPeriod(card.period);
  const metrics = getCardMetrics(card);
  const related = card.relatedCards
    .map((relatedId) => getCard(relatedId))
    .filter((item): item is NonNullable<typeof item> => item !== null && item.publicOnSite);
  const projects = card.projectSlugs
    .map((slug) => getProject(slug))
    .filter((project): project is NonNullable<typeof project> => project !== null);

  return (
    <main className="project-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="홈으로">
          <span>KJ</span>김종우
        </Link>
        <nav aria-label="주요 메뉴">
          <Link href="/experience/">경험</Link>
          <Link href="/#projects">프로젝트</Link>
          <Link href="/#profile">보유 기술</Link>
          <a href="https://github.com/kjw413" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <article className="project-detail">
        <Link className="back-link" href="/experience/">
          ← 전체 경험
        </Link>

        <p className="detail-eyebrow">
          {card.role}
          {card.status !== "확정" && <span className="status-chip">{card.status}</span>}
        </p>
        <h1>{card.title}</h1>
        <p className="detail-intro">{fillMetrics(card.headline)}</p>

        <div className="detail-meta">
          {period && (
            <div>
              <span>기간</span>
              <strong>{period}</strong>
            </div>
          )}
          <div>
            <span>확인 상태</span>
            <strong>{card.status}</strong>
          </div>
          {card.period.asOf && (
            <div>
              <span>기준일</span>
              <strong>{card.period.asOf}</strong>
            </div>
          )}
        </div>

        {card.highlights.length > 0 && (
          <ul className="card-highlights">
            {card.highlights.map((line) => (
              <li key={line}>{fillMetrics(line)}</li>
            ))}
          </ul>
        )}

        {metrics.length > 0 && (
          <section className="metric-evidence-list" aria-label="이 경험의 수치와 근거">
            <h2>수치와 근거</h2>
            <dl>
              {metrics.map((metric) => (
                <div key={metric.id}>
                  <dt>{metric.display}</dt>
                  <dd>{metric.label}</dd>
                  {metric.condition && <dd className="metric-condition">{metric.condition}</dd>}
                  <dd className="metric-basis">
                    {metric.basis}
                    {metric.status !== "확정" && ` · ${metric.status}`}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {card.teamContext && (
          <p className="team-context">
            <strong>팀 작업 범위</strong> {card.teamContext}
          </p>
        )}

        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: renderCardBody(card) }}
        />

        <div className="tag-row detail-tags">
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {(projects.length > 0 || card.evidence.length > 0) && (
          <section className="detail-gallery">
            <h2>연결된 자료</h2>
            <ul className="evidence-list">
              {projects.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}/`}>{project.title} 사례 →</Link>
                </li>
              ))}
              {card.evidence
                .filter((item) => item.url)
                .map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.label} ↗
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="detail-gallery">
            <h2>관련 경험</h2>
            <ul className="evidence-list">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/experience/${item.id}/`}>{item.title} →</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="detail-footer">
          <Link className="button secondary" href="/experience/">
            ← 전체 경험으로 돌아가기
          </Link>
        </div>
      </article>

      <footer>
        <div className="footer-bottom">
          <span>© 2026 김종우</span>
          <Link href="/">홈으로 ↑</Link>
        </div>
      </footer>
    </main>
  );
}
