"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

/*
 * 포트폴리오 PDF를 화면에서 구성하는 부분입니다. 넣을 프로젝트와 1쪽 구성을 고르면 아래
 * A4 미리보기가 바로 바뀌고, 'PDF로 저장'은 브라우저 인쇄로 이 미리보기를 그대로 PDF로
 * 만듭니다. 고른 구성은 주소(?p=…&hide=…)에 남아, 같은 주소를 열면 같은 PDF가 나옵니다.
 *
 * 주소가 유일한 상태입니다. 화면 상태를 따로 두지 않아, 뒤로 가기·새로고침·북마크가 모두
 * 같은 구성을 보여 줍니다. 정적 빌드에서는 주소를 모르므로 기본 구성(대표 프로젝트, 모든
 * 항목)으로 그리고, 브라우저에서 주소를 읽은 뒤 data-casebook-ready를 켭니다. PDF 생성
 * 스크립트는 이 표시를 기다린 뒤 인쇄합니다.
 */

export const SECTIONS = [
  { key: "summary", label: "소개문" },
  { key: "metrics", label: "대표 수치" },
  { key: "career", label: "경력" },
  { key: "education", label: "교육" },
  { key: "qualifications", label: "학력 · 자격" },
  { key: "toc", label: "수록 사례 목차" },
  { key: "link", label: "웹 포트폴리오 링크 · QR" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];
const SECTION_KEYS: readonly string[] = SECTIONS.map((section) => section.key);

export type CasebookMetricView = {
  id: string;
  display: string;
  label: string;
  condition: string | null;
};

export type CasebookProjectView = {
  slug: string;
  title: string;
  kind: string;
  period: string | null;
  summary: string;
  stack: string | null;
  role: string;
  problem: string;
  approach: string[];
  metrics: CasebookMetricView[];
  note: string | null;
  image: { src: string; caption: string | null } | null;
  featured: boolean;
};

type Row = { id: string; organization: string; role: string; period: string };

export type CasebookCoverView = {
  name: string;
  nameEn: string;
  tagline: string;
  summary: string;
  email: string | null;
  github: string;
  headline: { id: string; display: string; label: string }[];
  careers: Row[];
  education: Row[];
  qualifications: { label: string; title: string; detail: string }[];
  qrSvg: string;
  site: string;
  updated: string;
};

type Meta = {
  maxBytes: number;
  defaultPages: number;
  defaultBytes: number;
  allPages: number;
  allBytes: number;
  generatedAt: string;
};

type Props = {
  cover: CasebookCoverView;
  projects: CasebookProjectView[];
  metaHref: string;
  downloadHref: string | null;
};

/* ── 주소 ↔ 구성 ─────────────────────────────────────────── */

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

function setQuery(query: string) {
  window.history.replaceState(null, "", `${window.location.pathname}${query}${window.location.hash}`);
  for (const listener of listeners) listener();
}

type Selection = { selected: string[]; hidden: Set<SectionKey> };

function parseQuery(search: string, allSlugs: string[], defaults: string[]): Selection {
  const params = new URLSearchParams(search);
  const p = params.get("p");
  let selected = defaults;
  if (p === "all") selected = allSlugs;
  else if (p !== null) {
    selected = [...new Set(p.split(",").map((slug) => slug.trim()))].filter((slug) => allSlugs.includes(slug));
  }
  const hidden = new Set(
    (params.get("hide") ?? "").split(",").filter((key): key is SectionKey => SECTION_KEYS.includes(key)),
  );
  return { selected, hidden };
}

function toQuery({ selected, hidden }: Selection, defaults: string[]): string {
  const parts: string[] = [];
  if (selected.join(",") !== defaults.join(",")) parts.push(`p=${selected.join(",")}`);
  const hide = SECTIONS.map((section) => section.key).filter((key) => hidden.has(key));
  if (hide.length > 0) parts.push(`hide=${hide.join(",")}`);
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

/** 목차에 한 줄 설명까지 싣는 최대 사례 수. 넘으면 제목만 두 단으로 싣습니다. */
const TOC_FULL_LIMIT = 6;

function pageNo(value: number): string {
  return String(value).padStart(2, "0");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, "")}MB`;
}

/* ── 화면 ─────────────────────────────────────────────────── */

export function CasebookBuilder({ cover, projects, metaHref, downloadHref }: Props) {
  const allSlugs = useMemo(() => projects.map((project) => project.slug), [projects]);
  const defaults = useMemo(
    () => projects.filter((project) => project.featured).map((project) => project.slug),
    [projects],
  );
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => null);
  const ready = search !== null;
  const selection = useMemo(() => parseQuery(search ?? "", allSlugs, defaults), [search, allSlugs, defaults]);
  const { selected, hidden } = selection;
  const bySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);
  const chosen = selected.map((slug) => bySlug.get(slug)!).filter(Boolean);
  const rest = projects.filter((project) => !selected.includes(project.slug));
  const show = (key: SectionKey) => !hidden.has(key);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(metaHref)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Meta | null) => {
        if (alive && data) setMeta(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [metaHref]);

  const update = (next: Selection) => setQuery(toQuery(next, defaults));

  const toggleSection = (key: SectionKey) => {
    const hiddenNext = new Set(hidden);
    if (hiddenNext.has(key)) hiddenNext.delete(key);
    else hiddenNext.add(key);
    update({ selected, hidden: hiddenNext });
  };

  const toggleProject = (slug: string) => {
    update({
      selected: selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
      hidden,
    });
  };

  const move = (slug: string, step: -1 | 1) => {
    const index = selected.indexOf(slug);
    const target = index + step;
    if (index < 0 || target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    update({ selected: next, hidden });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const totalPages = 1 + chosen.length;

  return (
    <div className="cb-builder" data-casebook-ready={ready ? "true" : "false"} data-all-slugs={allSlugs.join(",")}>
      <aside className="cb-controls" aria-label="PDF 구성">
        <h1>포트폴리오 PDF 만들기</h1>
        <p className="cb-help">
          넣을 항목을 고르면 오른쪽 미리보기가 바로 바뀝니다. 고른 구성은 주소에 남아, 북마크해 두면 같은
          구성을 다시 열 수 있습니다.
        </p>

        <fieldset>
          <legend>1쪽 구성</legend>
          {SECTIONS.map((section) => (
            <label className="cb-check" key={section.key}>
              <input type="checkbox" checked={show(section.key)} onChange={() => toggleSection(section.key)} />
              <span>{section.label}</span>
            </label>
          ))}
          <p className="cb-help">이름과 연락처는 항상 들어갑니다.</p>
        </fieldset>

        <fieldset>
          <legend>
            프로젝트 <span>{chosen.length}개 선택 · 화살표로 순서 변경</span>
          </legend>
          <ol className="cb-picks">
            {chosen.map((project, index) => (
              <li className="cb-pick is-on" key={project.slug}>
                <label>
                  <input type="checkbox" checked onChange={() => toggleProject(project.slug)} />
                  <span className="cb-pick-no">{pageNo(index + 2)}</span>
                  <span className="cb-pick-title">{project.title}</span>
                </label>
                <span className="cb-move">
                  <button
                    type="button"
                    onClick={() => move(project.slug, -1)}
                    disabled={index === 0}
                    aria-label={`${project.title} 위로`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(project.slug, 1)}
                    disabled={index === chosen.length - 1}
                    aria-label={`${project.title} 아래로`}
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
            {rest.map((project) => (
              <li className="cb-pick" key={project.slug}>
                <label>
                  <input type="checkbox" checked={false} onChange={() => toggleProject(project.slug)} />
                  <span className="cb-pick-no" aria-hidden="true">
                    —
                  </span>
                  <span className="cb-pick-title">{project.title}</span>
                </label>
              </li>
            ))}
          </ol>
          <div className="cb-quick">
            <button type="button" onClick={() => update({ selected: defaults, hidden })}>
              대표만
            </button>
            <button type="button" onClick={() => update({ selected: allSlugs, hidden })}>
              모두
            </button>
            <button type="button" onClick={() => update({ selected: [], hidden })}>
              비우기
            </button>
          </div>
        </fieldset>

        <div className="cb-summary-line">
          <strong>A4 {totalPages}쪽</strong>
          {meta && (
            <span>
              모든 프로젝트와 항목을 넣은 최대 구성({meta.allPages}쪽)도 {formatBytes(meta.allBytes)}입니다. 어떤
              조합이든 {formatBytes(meta.maxBytes)} 한도 안에 들어갑니다.
            </span>
          )}
        </div>

        <div className="cb-actions">
          <button type="button" className="cb-btn primary" onClick={() => window.print()}>
            PDF로 저장
          </button>
          <button type="button" className="cb-btn" onClick={copyLink}>
            {copied ? "주소를 복사했습니다" : "이 구성의 주소 복사"}
          </button>
          <button type="button" className="cb-btn" onClick={() => setQuery("")}>
            기본 구성으로
          </button>
        </div>

        <ol className="cb-steps">
          <li>
            인쇄 창의 <b>대상</b>을 <b>PDF로 저장</b>으로 고릅니다.
          </li>
          <li>
            <b>설정 더보기</b>에서 <b>머리글과 바닥글</b>을 끕니다. 켜져 있으면 쪽마다 날짜와 주소가 찍힙니다.
          </li>
          <li>용지·여백은 이 페이지가 A4로 정해 두므로 바꾸지 않습니다.</li>
        </ol>
        <p className="cb-help">
          Chrome·Edge 기준입니다.
          {downloadHref && (
            <>
              {" "}
              기본 구성은{" "}
              <a href={downloadHref} download={`${cover.name}_포트폴리오.pdf`}>
                완성된 파일
              </a>
              로도 받을 수 있습니다.
            </>
          )}
        </p>
      </aside>

      <div className="casebook">
        <article className="resume-sheet cb-page cb-cover">
          <header className="resume-head">
            <div>
              <p className="resume-name">
                {cover.name}
                <span>{cover.nameEn}</span>
              </p>
              <p className="resume-tagline">{cover.tagline}</p>
            </div>
            <ul className="resume-contact">
              {cover.email && <li>{cover.email}</li>}
              <li>{cover.github}</li>
            </ul>
          </header>

          {show("summary") && <p className="resume-summary">{cover.summary}</p>}

          {show("metrics") && (
            <dl className="resume-metrics">
              {cover.headline.map((metric) => (
                <div key={metric.id}>
                  <dt>{metric.display}</dt>
                  <dd>{metric.label}</dd>
                </div>
              ))}
            </dl>
          )}

          {show("career") && <Rows title="경력" rows={cover.careers} />}
          {show("education") && <Rows title="교육" rows={cover.education} />}

          {show("qualifications") && (
            <section className="resume-section">
              <h2>학력 · 자격</h2>
              <dl className="resume-facts">
                {cover.qualifications.map((item) => (
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
          )}

          {show("toc") && chosen.length > 0 && (
            <section className="resume-section">
              <h2>수록 사례</h2>
              {/* 사례가 많으면 한 줄 설명을 빼고 두 단으로 줄여, 목차가 1쪽을 밀어내지 않게 합니다. */}
              <ol className={chosen.length > TOC_FULL_LIMIT ? "cb-toc compact" : "cb-toc"}>
                {chosen.map((project, index) => (
                  <li key={project.slug}>
                    <span className="cb-toc-no">{pageNo(index + 2)}</span>
                    <strong>{project.title}</strong>
                    <span className="cb-toc-text">{project.summary}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {show("link") && (
            <aside className="cb-link">
              <div className="cb-qr" dangerouslySetInnerHTML={{ __html: cover.qrSvg }} aria-hidden="true" />
              <div>
                <p className="cb-link-label">웹 포트폴리오</p>
                <p className="cb-link-url">{cover.site}</p>
                <p className="cb-link-text">
                  전체 프로젝트, 화면 갤러리, 모든 수치의 산출 조건과 확인 근거를 볼 수 있습니다.
                </p>
              </div>
            </aside>
          )}

          <p className="resume-foot cb-foot">
            <span>
              {cover.name} 포트폴리오 · 갱신 {cover.updated}
            </span>
            <span>01</span>
          </p>
        </article>

        {chosen.map((project, index) => (
          <ProjectSheet key={project.slug} project={project} index={index} site={cover.site} />
        ))}
      </div>
    </div>
  );
}

function Rows({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="resume-section">
      <h2>{title}</h2>
      <div className="cb-rows">
        {rows.map((row) => (
          <p className="cb-row" key={row.id}>
            <strong>{row.organization}</strong>
            <span>{row.role}</span>
            <time>{row.period}</time>
          </p>
        ))}
      </div>
    </section>
  );
}

function ProjectSheet({ project, index, site }: { project: CasebookProjectView; index: number; site: string }) {
  return (
    <article className="resume-sheet cb-page cb-project">
      <p className="cb-eyebrow">
        <span>
          PROJECT {pageNo(index + 1)} · {project.kind}
        </span>
        {project.period && <span>{project.period}</span>}
      </p>
      <h2 className="cb-title">{project.title}</h2>
      <p className="cb-summary">{project.summary}</p>
      <dl className="cb-meta">
        <div>
          <dt>역할</dt>
          <dd>{project.role}</dd>
        </div>
        {project.stack && (
          <div>
            <dt>기술</dt>
            <dd>{project.stack}</dd>
          </div>
        )}
      </dl>

      {project.image && (
        <figure className="cb-figure">
          {/* eslint-disable-next-line @next/next/no-img-element -- 인쇄용 정적 페이지 */}
          <img src={project.image.src} alt={project.image.caption ?? ""} />
          {project.image.caption && <figcaption>{project.image.caption}</figcaption>}
        </figure>
      )}

      <div
        className={[
          "cb-body",
          project.image ? "" : "no-figure",
          project.metrics.length > 0 || project.note ? "" : "no-results",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div>
          <h3>문제</h3>
          <p>{project.problem}</p>
          <h3>한 일</h3>
          <ul className="resume-items">
            {project.approach.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        {(project.metrics.length > 0 || project.note) && (
          <div className="cb-results">
            <h3>결과</h3>
            {project.metrics.length > 0 && (
              <dl>
                {project.metrics.map((metric) => (
                  <div key={metric.id}>
                    <dt>{metric.display}</dt>
                    <dd>
                      {metric.label}
                      {metric.condition && <span>{metric.condition}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {project.note && <p className="cb-note">{project.note}</p>}
          </div>
        )}
      </div>

      <p className="resume-foot cb-foot">
        <span>
          상세 사례 {site}/projects/{project.slug}/
        </span>
        <span>{pageNo(index + 2)}</span>
      </p>
    </article>
  );
}
