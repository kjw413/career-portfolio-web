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
import ImpactGrid from "./components/ImpactGrid";
import SiteHeader from "./components/SiteHeader";
import Stage from "./components/Stage";
import Story from "./components/Story";

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
    publicAssetExists(file)
      ? `${withBasePath(file)}?v=${publicAssetVersion(file)}`
      : null;

  return (
    <main>
      <SiteHeader />

      {/*
        첫 화면과 단계 설명이 한 무대를 씁니다. 3D 장면은 무대 맨 앞에 고정되고,
        글은 그 위로 흘러가며 카메라가 단계마다 다른 곳을 비춥니다.
      */}
      <Stage
        plants={plants}
        metric={{
          display: forecastError.display,
          condition: forecastError.condition,
        }}
        poster={posterFor("/hero-poster.webp")}
        posterDark={posterFor("/hero-poster-dark.webp")}
        caption="남한 지도 위 다섯 공장에서 에너지 데이터가 하나의 화면으로 모이는 모습"
      >
        <Hero
          profile={profile}
          metrics={getHeadlineMetrics(profile.headlineMetricIds)}
        />
        <Story plants={plants} />
      </Stage>

      <section className="impact-section" id="impact">
        <div className="section-heading">
          <div>
            <p className="section-index">
              <span>01</span>
              IMPACT
            </p>
            <h2>주요 성과</h2>
          </div>
        </div>
        <ImpactGrid impacts={profile.impacts} />
      </section>

      <section className="projects-section" id="projects">
        <div className="section-heading">
          <div>
            <p className="section-index">
              <span>02</span>
              PROJECTS
            </p>
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
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="card-link">
                자세히 보기 <b>→</b>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="section-heading">
          <div>
            <p className="section-index">
              <span>03</span>
              CAREER
            </p>
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
            <p className="section-index">
              <span>04</span>
              SKILLS
            </p>
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
                {capability.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Archive filters={filters} projects={catalog} />

      <section className="qualification-section" id="foundation">
        <div className="qualification-intro">
          <p className="section-index">
            <span>06</span>
            FOUNDATION
          </p>
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
          <h2>
            채용 문의는
            <br />
            이메일로 부탁드립니다.
          </h2>
        </div>
        <div className="footer-links">
          {profile.emailHref && (
            <a href={profile.emailHref}>
              {profile.emailHref.replace(/^mailto:/, "")}
            </a>
          )}
          <a href={profile.githubUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          {profile.resumeHref && (
            <a href={withBasePath(profile.resumeHref)}>이력서</a>
          )}
        </div>
        <div className="footer-bottom">
          <span>© 2026 김종우</span>
          <a href="#top">맨 위로 ↑</a>
        </div>
      </footer>
    </main>
  );
}
