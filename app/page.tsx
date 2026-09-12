import Link from "next/link";
import { getCatalogCategories, getProjectCatalog } from "../lib/catalog";
import { getProfile } from "../lib/content";
import skills from "../content/skills.json";
import { getHeadlineMetrics, getQualifications, getTimeline } from "../lib/ledger";
import { getFeaturedProjects, withBasePath } from "../lib/projects";
import Archive from "./archive";
import Timeline from "./components/Timeline";
import Hero from "./components/Hero";
import ImpactGrid from "./components/ImpactGrid";

export default function Home() {
  const profile = getProfile();
  const timeline = getTimeline();
  const catalog = getProjectCatalog();
  const featured = getFeaturedProjects(catalog);
  const filters = ["ALL", ...getCatalogCategories()];
  const qualifications = getQualifications();

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="처음으로">
          <span>KJ</span>김종우
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#impact">주요 성과</a>
          <a href="#projects">프로젝트</a>
          <a href="#experience">경력</a>
          <Link href="/experience/">경험 카드</Link>
          <a href="#contact">연락처</a>
        </nav>
      </header>

      <Hero profile={profile} metrics={getHeadlineMetrics(profile.headlineMetricIds)} />

      <section className="impact-section" id="impact">
        <div className="section-heading">
          <div>
            <p className="section-index">01</p>
            <h2>주요 성과</h2>
          </div>
          <p>실제 업무에 적용해 수치로 확인한 결과입니다.</p>
        </div>
        <ImpactGrid impacts={profile.impacts} />
      </section>

      <section className="projects-section" id="projects">
        <div className="section-heading">
          <div>
            <p className="section-index">02</p>
            <h2>대표 프로젝트</h2>
          </div>
          <p>
            데이터 수집부터 모델링, 서비스 구현,
            <br />현장 적용까지 직접 진행한 프로젝트입니다.
          </p>
        </div>
        <div className="project-grid">
          {featured.map((project, index) => (
            <Link
              className="project-card"
              href={`/projects/${project.slug}/`}
              key={project.slug}
            >
              <div className="card-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  {project.kind}
                  {project.status === "ongoing" && (
                    <span className="status-chip">진행 중</span>
                  )}
                </span>
              </div>
              {project.cover && (
                <div className="card-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={project.cover.src} alt="" loading="lazy" />
                </div>
              )}
              <h3>{project.title}</h3>
              <p>{project.intro}</p>
              <div className="tag-row">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="card-link">자세히 보기 <b>→</b></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="section-heading">
          <div>
            <p className="section-index">03</p>
            <h2>경력 · 교육</h2>
          </div>
          <p>
            재직 중인 회사와 이수한 교육 과정입니다.
            <br />
            <Link className="section-link" href="/experience/">
              경험별 수치와 근거 보기 →
            </Link>
          </p>
        </div>
        <Timeline entries={timeline} />
      </section>

      <section className="capability-section" id="profile">
        <div className="section-heading light-heading">
          <div>
            <p className="section-index">04</p>
            <h2>보유 기술</h2>
          </div>
          <p>실제 프로젝트와 업무에서 사용한 기술입니다.</p>
        </div>
        <div className="capability-grid">
          {skills.map((capability) => (
            <article className="capability-card" key={capability.index}>
              <div className="capability-index">{capability.index}</div>
              <h3>{capability.title}</h3>
              <p>{capability.text}</p>
              <div className="skill-list">
                {capability.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Archive filters={filters} projects={catalog} />

      <section className="qualification-section" id="foundation">
        <div className="qualification-intro">
          <p className="section-index">06</p>
          <h2>학력 · 자격 · 병역</h2>
          <p>지원서에 기재하는 기본 이력입니다.</p>
        </div>
        <div className="qualification-list">
          {qualifications.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact">
        <div>
          <p>연락처</p>
          <h2>채용 문의는<br />이메일로 부탁드립니다.</h2>
        </div>
        <div className="footer-links">
          {profile.emailHref && (
            <a href={profile.emailHref}>{profile.emailHref.replace(/^mailto:/, "")}</a>
          )}
          <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
          {profile.resumeHref && <a href={withBasePath(profile.resumeHref)}>이력서</a>}
        </div>
        <div className="footer-bottom">
          <span>© 2026 김종우</span>
          <a href="#top">맨 위로 ↑</a>
        </div>
      </footer>
    </main>
  );
}
