import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjects } from "../../../lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — 김종우 포트폴리오`,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main className="project-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="홈으로">
          <span>KJ</span>김종우
        </Link>
        <nav aria-label="주요 메뉴">
          <Link href="/#projects">프로젝트</Link>
          <Link href="/#experience">경력</Link>
          <Link href="/#profile">보유 기술</Link>
          <a href="https://github.com/kjw413" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <article className="project-detail">
        <Link className="back-link" href="/#archive">
          ← 전체 프로젝트
        </Link>

        <p className="detail-eyebrow">
          {project.kind}
          {project.status === "ongoing" && (
            <span className="status-chip">진행 중</span>
          )}
        </p>
        <h1>{project.title}</h1>
        {project.repoName !== project.title && (
          <p className="detail-repo">{project.repoName}</p>
        )}
        <p className="detail-intro">{project.intro}</p>

        <div className="detail-meta">
          {project.period && (
            <div>
              <span>기간</span>
              <strong>{project.period}</strong>
            </div>
          )}
          <div>
            <span>기술 스택</span>
            <strong>{project.stack ?? project.tags.join(" · ")}</strong>
          </div>
          <div>
            <span>상태</span>
            <strong>{project.status === "ongoing" ? "진행 중" : "완료"}</strong>
          </div>
          <div>
            <span>저장소</span>
            <strong>
              {project.github ? (
                <a href={project.github} target="_blank" rel="noreferrer">
                  {project.visibility === "PUBLIC" ? "공개" : "비공개"} ↗
                </a>
              ) : (
                project.visibility === "PUBLIC" ? "공개" : "비공개"
              )}
            </strong>
          </div>
        </div>

        <div className="tag-row detail-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {project.cover && (
          <figure className="detail-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.cover.src} alt={project.cover.caption ?? ""} />
            {project.cover.caption && <figcaption>{project.cover.caption}</figcaption>}
          </figure>
        )}

        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: project.bodyHtml }}
        />

        {project.gallery.length > 0 && (
          <section className="detail-gallery">
            <h2>관련 자료</h2>
            {project.gallery.map((item) => (
              <figure key={item.src} className={item.tall ? "tall" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.caption ?? ""} loading="lazy" />
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            ))}
          </section>
        )}

        <div className="detail-footer">
          <Link className="button secondary" href="/#archive">
            ← 전체 프로젝트로 돌아가기
          </Link>
          {project.github && (
            <a
              className="button primary"
              href={project.github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub에서 보기 ↗
            </a>
          )}
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
