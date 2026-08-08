import Link from "next/link";
import Archive from "./archive";
import fieldProjects from "../content/field-projects.json";
import { getCategories, getFeaturedProjects, getProjects } from "../lib/projects";

const metrics = [
  { value: "5개 공장", label: "데이터 통합 범위" },
  { value: "MAPE 7%", label: "전사 에너지 예측 오차" },
  { value: "40분 → 3분", label: "일일 수집 업무 시간" },
  { value: "1,000h", label: "임베디드 집중 교육" },
];

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

const experience = [
  {
    period: "2025 — PRESENT",
    role: "생산기술팀 · 제조 데이터 및 설비 개선",
    company: "BINGGRAE",
    points: [
      "5개 공장 에너지·생산 데이터 통합 및 AI 예측·진단·보고 서비스 구현",
      "MIS 데이터 수집, 투자 실적 검증 등 반복 업무 자동화",
      "냉동·공압·전력 유틸리티 분석과 원단위 개선 과제 수행",
      "혼합기획팩 자동화, 예지보전 TFT, PLC 2축 직교로봇 시범 경험",
    ],
  },
  {
    period: "2026",
    role: "사내 AI 전문가 육성과정",
    company: "AI ELITE",
    points: [
      "6:1 경쟁률 선발 후 제조 데이터 기반 서비스 프로젝트 완성",
      "예측 모델·LLM·웹 인터페이스를 하나의 실무 워크플로로 연결",
    ],
  },
  {
    period: "2024",
    role: "임베디드 시스템 개발 집중과정 · 1,000시간",
    company: "TELECHIPS EMBEDDED SCHOOL",
    points: [
      "TOPST D3 환경 Linux·FreeRTOS 기반 SPI/CAN 통신 구현 및 검증",
      "YOLOv5 적색 신호 인지와 임베디드 IPC 연계 프로젝트 수행",
    ],
  },
  {
    period: "EARLY CAREER",
    role: "CS 인턴 · 현장 기술지원",
    company: "INBODY",
    points: [
      "측정 이력과 QC 리포트를 교차 검증해 간헐 이상 현상의 원인 후보 도출",
      "고객 현장 정보와 기술 데이터를 함께 해석하며 문제 해결 관점 습득",
    ],
  },
];

export default function Home() {
  const projects = getProjects();
  const featured = getFeaturedProjects();
  const filters = getCategories();

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="처음으로">
          <span>K</span>JONGWOO
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#projects">PROJECTS</a>
          <a href="#experience">EXPERIENCE</a>
          <a href="#profile">PROFILE</a>
          <a href="https://github.com/kjw413" target="_blank" rel="noreferrer">
            GITHUB ↗
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            ELECTRICAL ENGINEERING <i /> MANUFACTURING <i /> AI
          </p>
          <h1>
            현장의 문제를
            <br />
            <span>데이터와 시스템</span>으로
            <br />
            해결합니다.
          </h1>
          <p className="hero-description">
            전자전기공학의 원리 이해, 제조 현장의 도메인 경험, 소프트웨어 구현력을
            연결해 <strong>실제로 사용되는 해결책</strong>을 만드는 엔지니어 김종우입니다.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#projects">
              프로젝트 살펴보기 <span>↓</span>
            </a>
            <a
              className="button secondary"
              href="https://github.com/kjw413"
              target="_blank"
              rel="noreferrer"
            >
              GitHub 전체 보기 ↗
            </a>
          </div>
        </div>

        <div className="system-visual" aria-label="데이터, 제어, AI를 연결하는 역량 구조">
          <div className="visual-grid" />
          <p className="visual-label">ENGINEERING SYSTEM / 2026</p>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="core">
            <span>PROBLEM</span>
            <strong>SOLVE</strong>
          </div>
          <div className="node node-data"><b>01</b> DATA</div>
          <div className="node node-control"><b>02</b> CONTROL</div>
          <div className="node node-ai"><b>03</b> AI</div>
          <div className="signal s1" />
          <div className="signal s2" />
          <div className="signal s3" />
          <p className="visual-note">FROM PHYSICAL SIGNAL<br />TO BUSINESS ACTION</p>
        </div>
      </section>

      <section className="metrics" aria-label="주요 수치">
        {metrics.map((metric) => (
          <div key={metric.value}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>

      <section className="projects-section" id="projects">
        <div className="section-heading">
          <div>
            <p className="section-index">01 / SELECTED WORK</p>
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

      <section className="capability-section" id="profile">
        <div className="section-heading light-heading">
          <div>
            <p className="section-index">02 / CAPABILITY MAP</p>
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

      <section className="experience-section" id="experience">
        <div className="section-heading">
          <div>
            <p className="section-index">03 / EXPERIENCE</p>
            <h2>현장과 기술을 오간 경험</h2>
          </div>
          <p>물리 현상을 이해하고, 데이터를 검증하며, 해결책을 끝까지 구현해 왔습니다.</p>
        </div>
        <div className="timeline">
          {experience.map((item, index) => (
            <article className="timeline-item" key={item.company}>
              <div className="timeline-marker"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="timeline-period">{item.period}</div>
              <div className="timeline-main">
                <p>{item.company}</p>
                <h3>{item.role}</h3>
              </div>
              <ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="field-section">
        <div className="section-heading compact-heading">
          <div>
            <p className="section-index">04 / FIELD ENGINEERING</p>
            <h2>제조 현장의 개선 과제</h2>
          </div>
        </div>
        <div className="field-grid">
          {fieldProjects.map((project) => (
            <article key={project.num}>
              <div className="field-meta"><span>{project.num}</span><span>{project.label}</span></div>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
            </article>
          ))}
        </div>
      </section>

      <Archive
        filters={filters}
        projects={projects.map((project) => ({
          slug: project.slug,
          category: project.category,
          repoName: project.repoName,
          summary: project.summary,
          stack: project.stack,
          visibility: project.visibility,
          ongoing: project.status === "ongoing",
        }))}
      />

      <section className="qualification-section">
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

      <footer>
        <div>
          <p>OPEN TO THE NEXT PROBLEM</p>
          <h2>기술과 현장 사이의<br />새로운 문제를 기다립니다.</h2>
        </div>
        <div className="footer-links">
          <a href="https://github.com/kjw413" target="_blank" rel="noreferrer">GITHUB ↗</a>
          <span>PHOTO & CONTACT — TO BE ADDED</span>
        </div>
        <div className="footer-bottom"><span>© 2026 KIM JONGWOO</span><a href="#top">BACK TO TOP ↑</a></div>
      </footer>
    </main>
  );
}
