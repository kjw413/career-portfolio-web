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
  // 장면 옆에 적는 수치도 원장에서 읽습니다. 값·조건을 따로 적어 두지 않습니다.
  const sceneFacts = ["bems-plants", "forecast-mape-all", "bems-monthly-saving"].map((id) => ({
    id,
    ...getMetric(id),
  }));
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
          <p className="section-index">공장 에너지 AI 플랫폼 · 사내 AI 전문가 과정 팀과제</p>
          <h2 id="scene-heading">
            다섯 공장의 전력·연료·용수 데이터를 한 시스템에 모아,
            <br />예측과 실측을 함께 봅니다.
          </h2>
          <p>
            공장마다 다르던 생산·에너지 데이터 형식을 표준화해 MySQL에 담고, 조회·비교·원단위
            분석·예측·AI 보고서를 하나의 사내 웹 시스템에서 처리합니다. 예측모델은 부스팅 3종과
            피처셋 2종을 가중 결합해 초기 단일 모델의 오차를 낮췄고, 예측값은 실적과 함께 보는
            보조지표로 씁니다.
          </p>
          <dl className="scene-facts">
            {sceneFacts.map((fact) => (
              <div key={fact.id}>
                <dt>{fact.display}</dt>
                <dd>
                  {fact.label}
                  {fact.condition && <small>{fact.condition}</small>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="scene-role">
            사내 AI 전문가 과정 팀과제로 시작해 사내에서 운영 중입니다. 기획·개발과 예측모델
            설계를 맡았습니다.
          </p>
          <div className="scene-links">
            <Link className="section-link" href="/projects/ai-elite-bems/">
              프로젝트 자세히 →
            </Link>
            <Link className="section-link" href="/experience/EXP-BG-ENERGY-WEB/">
              경험 카드 →
            </Link>
          </div>
        </div>
        <HeroSceneGate
          plants={plants}
          metric={{ display: forecastError.display, condition: forecastError.condition }}
          poster={posterFor("/hero-poster.webp")}
          posterDark={posterFor("/hero-poster-dark.webp")}
          caption="다섯 공장의 에너지 데이터가 하나의 시스템으로 모이는 흐름"
        />
      </section>

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
