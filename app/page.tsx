"use client";

import { useState } from "react";

const metrics = [
  { value: "5개 공장", label: "데이터 통합 범위" },
  { value: "3–5%", label: "에너지 예측 MAPE" },
  { value: "1,000h", label: "임베디드 집중 교육" },
  { value: "6:1", label: "사내 AI 과정 선발" },
];

const featured = [
  {
    number: "01",
    kind: "AI · DATA · WEB",
    title: "공장 에너지 AI 플랫폼",
    summary:
      "5개 공장의 에너지·생산 데이터를 통합하고 예측, 이상 진단, 보고까지 하나의 업무 흐름으로 연결했습니다.",
    tags: ["Python", "MySQL", "Streamlit", "LangChain"],
    href: "https://github.com/kjw413/AI-Elite-BEMS",
  },
  {
    number: "02",
    kind: "RPA · MANUFACTURING",
    title: "MIS 데이터 수집 자동화",
    summary:
      "화면 기반 수집부터 공장별 원천 데이터 재가공까지 자동화해, 반복 업무를 분석 가능한 데이터 파이프라인으로 전환했습니다.",
    tags: ["Python", "RPA", "Excel", "ETL"],
    href: "https://github.com/kjw413/AI-Elite_MIS_RPA",
  },
  {
    number: "03",
    kind: "EMBEDDED · VISION",
    title: "차량용 적색 신호 인지",
    summary:
      "YOLOv5 객체 탐지와 임베디드 보드 IPC를 연계해 카메라 입력에서 적색 신호를 인지하고 제어기로 전달했습니다.",
    tags: ["YOLOv5", "Linux", "OpenCV", "IPC"],
    href: "https://github.com/kjw413/telechips-embedded-school-pmsa-project",
  },
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

const archive = [
  { category: "AI · DATA", title: "AI-Elite-BEMS", description: "5개 공장 에너지·생산 데이터의 조회–예측–진단–보고 통합 플랫폼", stack: "Python · MySQL · Streamlit · LangChain", href: "https://github.com/kjw413/AI-Elite-BEMS", visibility: "PUBLIC" },
  { category: "AUTOMATION", title: "AI-Elite_MIS_RPA", description: "생산실적·유틸리티·재공품 MIS 수집과 표준 데이터셋 생성 자동화", stack: "Python · RPA · Excel · ETL", href: "https://github.com/kjw413/AI-Elite_MIS_RPA", visibility: "PUBLIC" },
  { category: "AI · DATA", title: "trading-bot", description: "한·미 주식 이벤트 기반 백테스트, 모의투자, 리스크 관리 및 퀀트 팩터 시스템", stack: "Python · Parquet · Backtest · Quant", href: "https://github.com/kjw413/trading-bot", visibility: "PRIVATE" },
  { category: "AUTOMATION", title: "investment_checker_RPA", description: "ERP와 실제 투자 이력을 비교해 미등록·계정 누락 후보를 탐지하는 검증 도구", stack: "Python · Excel · Validation · RPA", href: "https://github.com/kjw413/investment_checker_RPA", visibility: "PRIVATE" },
  { category: "SOFTWARE", title: "Masking", description: "엑셀의 지정 셀을 안전하게 익명화하고 보고서와 대응표를 생성하는 데스크톱 앱", stack: "Python · Tkinter · openpyxl · Testing", href: "https://github.com/kjw413/Masking", visibility: "PUBLIC" },
  { category: "SOFTWARE", title: "to-do-list-app", description: "휴일·휴가를 반영한 영업일과 긴급도를 계산하는 Windows 업무 관리 앱", stack: "Python · Tkinter · JSON · PyInstaller", href: "https://github.com/kjw413/to-do-list-app", visibility: "PUBLIC" },
  { category: "EMBEDDED", title: "telechips-embedded-school-pmsa-project", description: "임베디드 차량용 플랫폼의 통신·인지·제어 기능을 통합한 교육 프로젝트", stack: "C/C++ · Linux · FreeRTOS · YOLOv5", href: "https://github.com/kjw413/telechips-embedded-school-pmsa-project", visibility: "PUBLIC · PREPARING" },
  { category: "CAREER", title: "career", description: "경험과 지원 직무를 연결하기 위한 커리어 자료 및 문서 아카이브", stack: "Documentation · Career Design", href: "https://github.com/kjw413/career", visibility: "PRIVATE" },
];

const fieldProjects = [
  { num: "01", title: "2축 직교로봇 Pick & Place", label: "PLC / MOTION", text: "XG-5000과 서보 모듈을 사용해 홈–픽업–배치 시퀀스, 센서 인터록, 비상정지 로직을 구현했습니다." },
  { num: "02", title: "예지보전 통신 검증", label: "PREDICTIVE MAINTENANCE", text: "공압기 모터·변압기 대상 데이터 통신 방식을 비교하고 UART 연결과 지연시간 단축 검증을 지원했습니다." },
  { num: "03", title: "혼합기획팩 자동화 기획", label: "PRODUCTION ENGINEERING", text: "생산량·인원·사이클타임·다운타임·노무비를 구조화해 노동집중 공정의 자동화 타당성을 분석했습니다." },
  { num: "04", title: "유틸리티 원단위 관리", label: "ENERGY / UTILITY", text: "전력·냉동·공압 사용량과 생산량의 관계를 해석해 일일·주간 Alert와 개선 우선순위를 설계했습니다." },
];

export default function Home() {
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "AI · DATA", "AUTOMATION", "SOFTWARE", "EMBEDDED", "CAREER"];
  const filteredProjects = filter === "ALL" ? archive : archive.filter((project) => project.category === filter);

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
          {featured.map((project) => (
            <a
              className="project-card"
              href={project.href}
              target="_blank"
              rel="noreferrer"
              key={project.number}
            >
              <div className="card-top">
                <span>{project.number}</span>
                <span>{project.kind}</span>
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <div className="tag-row">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="card-link">CASE STUDY <b>↗</b></div>
            </a>
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

      <section className="archive-section" id="archive">
        <div className="archive-header">
          <div>
            <p className="section-index">05 / GITHUB ARCHIVE</p>
            <h2>전체 프로젝트 저장소</h2>
          </div>
          <div className="filter-row" role="group" aria-label="프로젝트 분야 필터">
            {filters.map((item) => (
              <button
                type="button"
                className={filter === item ? "active" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="archive-list" aria-live="polite">
          {filteredProjects.map((project, index) => (
            <a href={project.href} target="_blank" rel="noreferrer" className="archive-row" key={project.title}>
              <span className="archive-num">{String(index + 1).padStart(2, "0")}</span>
              <div className="archive-title"><small>{project.category}</small><h3>{project.title}</h3></div>
              <p>{project.description}</p>
              <div className="archive-stack">{project.stack}</div>
              <span className="visibility">{project.visibility}</span>
              <span className="archive-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

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
