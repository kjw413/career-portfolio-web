import Link from "next/link";
import { getCatalogCategories, getProjectCatalog } from "../lib/catalog";
import { getExperiences, getProfile } from "../lib/content";
import { getFeaturedProjects, withBasePath } from "../lib/projects";
import Archive from "./archive";
import ExperienceAccordion from "./components/ExperienceAccordion";
import Hero from "./components/Hero";
import ImpactGrid from "./components/ImpactGrid";

const capabilities = [
  {
    index: "A",
    title: "Data & AI",
    text: "현장 데이터를 정제하고 예측 모델과 LLM을 연결해 의사결정 가능한 결과로 변환합니다.",
    skills: ["Python", "SQL", "Forecasting", "Anomaly Detection", "LangChain", "LLM API"],
  },
  {
    index: "B",
    title: "Software & Automation",
    text: "반복 업무의 입력부터 검증·보고까지 흐름을 설계하고 사용자가 직접 쓰는 도구로 구현합니다.",
    skills: ["Streamlit", "RPA", "MySQL", "Tkinter", "Git", "Excel Automation"],
  },
  {
    index: "C",
    title: "Embedded & Control",
    text: "신호와 통신, 제어 로직을 이해하고 임베디드 Linux와 MCU 환경에서 기능을 검증합니다.",
    skills: ["C/C++", "Linux", "FreeRTOS", "CAN", "SPI", "OpenCV", "PLC"],
  },
  {
    index: "D",
    title: "Manufacturing Domain",
    text: "생산·유틸리티·설비의 물리 현상을 데이터 구조와 개선 과제로 번역합니다.",
    skills: ["Energy", "Utility", "Refrigeration", "Production", "ROI", "Process Improvement"],
  },
];

export default function Home() {
  const profile = getProfile();
  const experiences = getExperiences();
  const catalog = getProjectCatalog();
  const featured = getFeaturedProjects(catalog);
  const filters = ["ALL", ...getCatalogCategories()];

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="처음으로">
          <span>K</span>JONGWOO
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#impact">IMPACT</a>
          <a href="#projects">PROJECTS</a>
          <a href="#experience">EXPERIENCE</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </header>

      <Hero profile={profile} />

      <section className="impact-section" id="impact">
        <div className="section-heading">
          <div>
            <p className="section-index">01 / SELECTED IMPACT</p>
            <h2>문제를 성과로 바꾼 과정</h2>
          </div>
          <p>현장의 문제를 구조화하고, 기술로 연결해 검증 가능한 결과를 만들었습니다.</p>
        </div>
        <ImpactGrid impacts={profile.impacts} />
      </section>

      <section className="projects-section" id="projects">
        <div className="section-heading">
          <div>
            <p className="section-index">02 / FEATURED PROJECTS</p>
            <h2>기술을 결과로 바꾼 프로젝트</h2>
          </div>
          <p>
            분석에서 멈추지 않고 데이터 수집, 모델링, 서비스 구현,
            <br />현장 적용까지 이어진 경험을 선별했습니다.
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
                    <span className="status-chip">IN PROGRESS</span>
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
              <div className="card-link">CASE STUDY <b>→</b></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="section-heading">
          <div>
            <p className="section-index">03 / EXPERIENCE</p>
            <h2>현장과 기술을 오간 경험</h2>
          </div>
          <p>물리 현상을 이해하고, 데이터를 검증하며, 해결책을 끝까지 구현해 왔습니다.</p>
        </div>
        <ExperienceAccordion items={experiences} />
      </section>

      <section className="capability-section" id="profile">
        <div className="section-heading light-heading">
          <div>
            <p className="section-index">04 / CAPABILITY MAP</p>
            <h2>경계를 연결하는 역량</h2>
          </div>
          <p>전자전기공학의 기반 위에 제조 도메인과 소프트웨어 구현력을 쌓았습니다.</p>
        </div>
        <div className="capability-grid">
          {capabilities.map((capability) => (
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
          <p className="section-index">06 / FOUNDATION</p>
          <h2>공학적 기반과<br />지속적인 학습</h2>
          <p>직무명이 달라져도 문제를 구조화하고 기술을 빠르게 습득하는 방식은 같습니다.</p>
        </div>
        <div className="qualification-list">
          <div><span>EDUCATION</span><strong>전자전기공학 전공</strong><p>회로·전자·제어·신호의 기초 위에서 시스템을 이해합니다.</p></div>
          <div><span>CERTIFICATE</span><strong>ADsP · 컴퓨터활용능력 1급</strong><p>데이터 분석의 기초와 실무형 데이터 처리 역량을 갖췄습니다.</p></div>
          <div><span>LANGUAGE</span><strong>OPIc IH</strong><p>영어 회화 활동을 통해 기술 정보를 이해하고 소통하는 기반을 다졌습니다.</p></div>
          <div><span>WORK STYLE</span><strong>현장 검증 · 빠른 구현 · 문서화</strong><p>가설을 데이터로 확인하고 재사용 가능한 결과물로 남깁니다.</p></div>
        </div>
      </section>

      <footer id="contact">
        <div>
          <p>OPEN TO THE NEXT PROBLEM</p>
          <h2>기술과 현장 사이의<br />새로운 문제를 기다립니다.</h2>
        </div>
        <div className="footer-links">
          {profile.emailHref && <a href={profile.emailHref}>EMAIL</a>}
          <a href={profile.githubUrl} target="_blank" rel="noreferrer">GITHUB ↗</a>
          {profile.resumeHref && <a href={withBasePath(profile.resumeHref)}>이력서</a>}
        </div>
        <div className="footer-bottom"><span>© 2026 KIM JONGWOO</span><a href="#top">BACK TO TOP ↑</a></div>
      </footer>
    </main>
  );
}
