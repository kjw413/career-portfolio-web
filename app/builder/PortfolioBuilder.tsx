"use client";

/**
 * 포트폴리오 빌더. 경험 카드와 프로젝트 사례를 골라 회사별 PDF를 만듭니다.
 *
 * - 고른 구성은 주소(URL)에만 담깁니다. 저장소에도, 서버에도 남지 않습니다.
 *   회사별 구성을 다시 쓰려면 "구성 링크 복사"로 받은 주소를 비공개 문서에 보관합니다.
 * - 전화번호처럼 저장소에 없는 연락처는 이 기기(localStorage)에만 두고 주소에는 넣지 않습니다.
 * - PDF는 브라우저 인쇄로 만듭니다. 인쇄할 때는 이 조작 화면이 빠지고 문서만 남습니다.
 *
 * 이 컴포넌트는 브라우저에서만 그립니다(BuilderLoader). 그래서 첫 렌더에서 주소를 바로 읽습니다.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PortfolioData } from "../../lib/portfolio";
import {
  SECTION_KEYS,
  decodeSelection,
  encodeSelection,
  levelOf,
  moveItem,
  presetForJob,
  sanitizeRef,
  selectionWarnings,
  setLevel,
  type Level,
  type SectionKey,
  type Selection,
} from "../../lib/portfolio-selection";
import PortfolioDocument from "./PortfolioDocument";

const SECTION_LABEL: Record<SectionKey, string> = {
  summary: "소개",
  metrics: "핵심 수치",
  history: "경력 · 교육",
  qualifications: "학력 · 자격 · 병역",
  skills: "보유 기술",
};
const LEVEL_LABEL: Record<Level, string> = { summary: "요약", detail: "상세" };
const CONTACT_KEY = "portfolio-builder:contact";

function readContact(): string {
  try {
    return window.localStorage.getItem(CONTACT_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function PortfolioBuilder({ data }: { data: PortfolioData }) {
  const available = new Set(data.modules.map((entry) => entry.id));
  const [selection, setSelection] = useState<Selection>(() =>
    decodeSelection(window.location.search, {
      available: new Set(data.modules.map((entry) => entry.id)),
      guides: data.guides,
      fallback: data.defaultItems,
    }),
  );
  const [contact, setContact] = useState(readContact);
  const [today] = useState(() => new Date());
  const [copied, setCopied] = useState(false);

  const guide = data.guides.find((item) => item.job === selection.job) ?? null;
  const asOf = selection.asOf ? new Date(`${selection.asOf}T00:00:00`) : today;
  const warnings = selectionWarnings(selection, data.modules, guide);
  const warned = new Set(warnings.map((warning) => warning.id));
  const unavailable = guide ? presetForJob(guide, available).unavailable : [];
  const titleOf = new Map(data.modules.map((entry) => [entry.id, entry.title]));
  const detailCount = selection.items.filter((item) => item.level === "detail").length;

  // 구성이 바뀌면 주소도 따라 바뀝니다. 이 주소가 곧 저장본입니다.
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}?${encodeSelection(selection)}`);
  }, [selection]);

  useEffect(() => {
    try {
      if (contact) window.localStorage.setItem(CONTACT_KEY, contact);
      else window.localStorage.removeItem(CONTACT_KEY);
    } catch {
      // 저장이 막힌 브라우저에서는 이번 문서에만 씁니다.
    }
  }, [contact]);

  const update = (patch: Partial<Selection>) => setSelection((current) => ({ ...current, ...patch }));

  const chooseJob = (job: string) => {
    const next = data.guides.find((item) => item.job === job);
    // 직무군을 고르면 그 프리셋으로 바꿉니다. "직접 고르기"는 지금 구성을 그대로 둡니다.
    if (next) update({ job: next.job, items: presetForJob(next, available).items });
    else update({ job: null });
  };

  const toggleSection = (key: SectionKey) =>
    update({
      hidden: selection.hidden.includes(key)
        ? selection.hidden.filter((item) => item !== key)
        : [...selection.hidden, key],
    });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드를 못 쓰면 주소창의 주소를 직접 복사하면 됩니다.
    }
  };

  const groups: { name: string; entries: PortfolioData["modules"] }[] = [];
  for (const entry of data.modules) {
    const group = groups.find((item) => item.name === entry.group);
    if (group) group.entries.push(entry);
    else groups.push({ name: entry.group, entries: [entry] });
  }

  const badgeOf = (id: string): string | null => {
    if (!guide) return null;
    if (guide.primary.includes(id)) return "1순위";
    if (guide.secondary.includes(id)) return "보조";
    if (guide.exclude.includes(id)) return "제외 권장";
    return null;
  };

  return (
    <div className="pf-app">
      <aside className="pf-panel" aria-label="포트폴리오 구성">
        <div className="pf-panel-head">
          <Link className="pf-home" href="/">
            ← 포트폴리오 홈
          </Link>
          <p className="pf-panel-title">포트폴리오 빌더</p>
          <p className="pf-panel-note">
            실을 경험을 고르면 오른쪽 문서가 바뀝니다. 구성은 이 주소에만 담기고 어디에도 저장되지
            않습니다.
          </p>
          <div className="pf-actions">
            <button type="button" className="pf-primary" onClick={() => window.print()}>
              PDF로 저장
            </button>
            <button type="button" onClick={copyLink}>
              {copied ? "복사했습니다" : "구성 링크 복사"}
            </button>
          </div>
          <p className="pf-panel-note">
            인쇄 창에서 대상은 &ldquo;PDF로 저장&rdquo;, 용지는 A4, 머리글·바닥글은 끄고 배경 그래픽은 켭니다.
          </p>
        </div>

        <section className="pf-block">
          <h2>직무군</h2>
          <label className="visually-hidden" htmlFor="pf-job">
            직무군 프리셋
          </label>
          <select
            id="pf-job"
            value={selection.job ?? ""}
            onChange={(event) => chooseJob(event.target.value)}
          >
            <option value="">직접 고르기</option>
            {data.guides.map((item) => (
              <option key={item.job} value={item.job}>
                {item.job}
              </option>
            ))}
          </select>
          <p className="pf-hint">
            {guide
              ? "1순위 경험은 상세로, 보조 경험은 요약으로 채웠습니다. 아래에서 더하거나 뺄 수 있습니다."
              : "직무군을 고르면 원장의 선택 가이드대로 채웁니다."}
          </p>
          {guide?.excludeReason && <p className="pf-hint">제외 기준: {guide.excludeReason}</p>}
          {unavailable.length > 0 && (
            <p className="pf-hint">
              사이트에 공개하지 않아 실을 수 없는 카드: {unavailable.join(", ")}
            </p>
          )}
          <div className="pf-actions">
            <button type="button" onClick={() => update({ job: null, items: data.defaultItems })}>
              기본 구성으로
            </button>
            <button type="button" onClick={() => update({ items: [] })}>
              모두 빼기
            </button>
          </div>
        </section>

        {warnings.length > 0 && (
          <section className="pf-block pf-warnings" role="status">
            <h2>제출 전 확인 {warnings.length}건</h2>
            <ul>
              {warnings.map((warning) => (
                <li key={`${warning.id}-${warning.kind}`}>{warning.message}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="pf-block">
          <h2>
            싣는 순서
            <small>
              {selection.items.length}개 · 상세 {detailCount} · 요약 {selection.items.length - detailCount}
            </small>
          </h2>
          {selection.items.length === 0 ? (
            <p className="pf-hint">아직 고른 경험이 없습니다.</p>
          ) : (
            <ol className="pf-order">
              {selection.items.map((item, index) => (
                <li key={item.id}>
                  <span>
                    {titleOf.get(item.id)}
                    <small>{LEVEL_LABEL[item.level]}</small>
                  </span>
                  <button
                    type="button"
                    aria-label={`${titleOf.get(item.id)} 위로`}
                    disabled={index === 0}
                    onClick={() => update({ items: moveItem(selection.items, item.id, -1) })}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${titleOf.get(item.id)} 아래로`}
                    disabled={index === selection.items.length - 1}
                    onClick={() => update({ items: moveItem(selection.items, item.id, 1) })}
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {groups.map((group) => (
          <section className="pf-block" key={group.name}>
            <h2>{group.name}</h2>
            <ul className="pf-modules">
              {group.entries.map((entry) => {
                const level = levelOf(selection.items, entry.id);
                const badge = badgeOf(entry.id);
                return (
                  <li
                    key={entry.id}
                    data-selected={level ? "" : undefined}
                    data-warned={warned.has(entry.id) ? "" : undefined}
                  >
                    <p className="pf-module-title">
                      {entry.title}
                      {badge && (
                        <span className="pf-badge" data-tone={badge === "제외 권장" ? "warn" : undefined}>
                          {badge}
                        </span>
                      )}
                      {entry.status && entry.status !== "확정" && (
                        <span className="pf-badge">{entry.status}</span>
                      )}
                    </p>
                    <fieldset className="pf-level">
                      <legend className="visually-hidden">{entry.title} 싣는 방식</legend>
                      {([null, "summary", "detail"] as const).map((option) => (
                        <label key={option ?? "none"}>
                          <input
                            type="radio"
                            name={`level-${entry.id}`}
                            checked={level === option}
                            onChange={() => update({ items: setLevel(selection.items, entry.id, option) })}
                          />
                          <span>{option ? LEVEL_LABEL[option] : "제외"}</span>
                        </label>
                      ))}
                    </fieldset>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section className="pf-block">
          <h2>기본 이력 섹션</h2>
          <ul className="pf-checks">
            {SECTION_KEYS.map((key) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={!selection.hidden.includes(key)}
                    onChange={() => toggleSection(key)}
                  />
                  {SECTION_LABEL[key]}
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="pf-block pf-fields">
          <h2>제출 정보</h2>
          <label htmlFor="pf-ref">추적 코드</label>
          <input
            id="pf-ref"
            type="text"
            autoComplete="off"
            placeholder="예: a07"
            value={selection.ref}
            onChange={(event) => update({ ref: sanitizeRef(event.target.value) })}
          />
          <p className="pf-hint">
            문서 속 사이트 링크에 ?ref=코드가 붙어, 방문 통계에서 이 PDF로 들어온 방문이 구분됩니다.
            코드와 회사의 대응표는 비공개 문서에만 둡니다.
          </p>

          <label htmlFor="pf-date">기준일</label>
          <input
            id="pf-date"
            type="date"
            value={selection.asOf ?? ""}
            onChange={(event) => update({ asOf: event.target.value || null })}
          />
          <p className="pf-hint">재직기간을 이 날짜로 계산합니다. 비우면 오늘입니다.</p>

          <label htmlFor="pf-contact">추가 연락처</label>
          <input
            id="pf-contact"
            type="text"
            placeholder="예: 전화번호"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
          />
          <p className="pf-hint">
            저장소에 없는 정보입니다. 이 기기에만 저장되고 구성 링크에는 들어가지 않습니다.
          </p>
        </section>
      </aside>

      <div className="pf-stage">
        <PortfolioDocument data={data} selection={selection} contact={contact} asOf={asOf} />
      </div>
    </div>
  );
}
