import Link from "next/link";
import { getCatalogCategories, getProjectCatalog } from "../lib/catalog";
import { getProfile } from "../lib/content";
import skills from "../content/skills.json";
import {
  getHeadlineMetrics,
  getMetric,
  getPlantNames,
  getQualifications,
  getTimeline,
} from "../lib/ledger";
import {
  getFeaturedProjects,
  publicAssetExists,
  publicAssetVersion,
  withBasePath,
} from "../lib/projects";
import Archive from "./archive";
import Timeline from "./components/Timeline";
import Hero from "./components/Hero";
import HeroSceneGate from "./components/hero-scene";
import ImpactGrid from "./components/ImpactGrid";

export default function Home() {
  const profile = getProfile();
  const timeline = getTimeline();
  const catalog = getProjectCatalog();
  const featured = getFeaturedProjects(catalog);
  const filters = ["ALL", ...getCatalogCategories()];
  const qualifications = getQualifications();
  // 장면에 세우는 공장 이름과 예측 오차도 원장에서 읽습니다. 화면과 사실이 갈라지지 않게.
  const plants = getPlantNames();
  const forecastError = getMetric("forecast-mape-all");
  // 포스터는 이름이 같은 채로 다시 만들어지므로, 내용 해시로 캐시를 깹니다.
  const posterFor = (file: string) =>
    publicAssetExists(file) ? `${withBasePath(file)}?v=${publicAssetVersion(file)}` : null;

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

      <section className="scene-section" aria-labelledby="scene-heading">
        <div className="scene-intro">
          <p className="section-index">공장 에너지 AI 플랫폼</p>
          <h2 id="scene-heading">
            다섯 공장의 에너지 데이터가
            <br />한 화면에 모입니다.
          </h2>
          <p>
            전력·연료·용수와 생산 실적을 하나로 모아 AI 예측과 실측을 나란히 보는,
            사내에서 운영 중인 시스템입니다.
          </p>
          <Link className="section-link" href="/projects/ai-elite-bems/">
            프로젝트 보기 →
          </Link>
        </div>
        <HeroSceneGate
          plants={plants}
          metric={{ display: forecastError.display, condition: forecastError.condition }}
          poster={posterFor("/hero-poster.webp")}
          posterDark={posterFor("/hero-poster-dark.webp")}
          caption="남한 지도 위 다섯 공장에서 에너지 데이터가 하나의 화면으로 모이는 모습"
        />
      </section>

      <section className="impact-section" id="impact">
        <div className="section-heading">
          <div>
            <p className="section-index">01</p>
            <h2>주요 성과</h2>
          </div>
        </div>
        <ImpactGrid impacts={profile.impacts} />
      </section>

      <section className="projects-section" id="projects">
        <div className="section-heading">
          <div>
            <p className="section-index">02</p>
            <h2>대표 프로젝트</h2>
          </div>
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
          <Link className="section-link" href="/experience/">
            전체 경험 보기 →
          </Link>
        </div>
        <Timeline entries={timeline} />
      </section>

      <section className="capability-section" id="profile">
        <div className="section-heading light-heading">
          <div>
            <p className="section-index">04</p>
            <h2>보유 기술</h2>
          </div>
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
