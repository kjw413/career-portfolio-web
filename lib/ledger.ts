/**
 * 원장을 화면이 쓰는 형태로 바꿔 주는 얇은 층입니다.
 * 읽기와 검증은 `ledger-core.mjs`에 있고, 여기서는 타입과 화면용 파생만 다룹니다.
 */

import { marked } from "marked";
import { loadLedger, resolveMetricTokens } from "./ledger-core.mjs";
import { formatYearMonth } from "./tenure";

export type LedgerStatus = "확정" | "부분확정" | "미확정" | "진행중";

export type Metric = {
  display: string;
  value?: number | string;
  unit?: string;
  label: string;
  condition?: string;
  basis: string;
  status: LedgerStatus;
  confirmedAt?: string;
  cardIds: string[];
  aliases?: string[];
  doNotConfuseWith?: string[];
  deprecated?: string[];
  notes?: string;
};

export type Evidence = { type: string; label: string; url?: string; ref?: string };

export type ExperienceCard = {
  id: string;
  title: string;
  status: LedgerStatus;
  affiliation: string;
  role: string;
  period: { start: string | null; end: string | null; asOf: string | null };
  headline: string;
  highlights: string[];
  teamContext: string | null;
  metricIds: string[];
  tags: string[];
  useFor: string[];
  excludeFor: string[];
  relatedCards: string[];
  projectSlugs: string[];
  evidence: Evidence[];
  canonical: string[];
  forbidden: string[];
  openQuestions: string[];
  publicOnSite: boolean;
  order: number;
  body: string;
};

/** 홈 화면 타임라인의 한 시기. 안에 든 항목은 전부 경험 카드에서 생성합니다. */
export type TimelineEntry = {
  id: string;
  kind: string;
  period: string;
  organization: string;
  role: string;
  summary: string;
  items: TimelineItem[];
  tags: string[];
};

export type TimelineItem = {
  cardId: string;
  title: string;
  headline: string;
  /** 한 시기에 카드가 하나뿐일 때만 채웁니다. 그 카드가 곧 그 시기의 전부이기 때문입니다. */
  highlights: string[];
  status: LedgerStatus;
};

const ledger = loadLedger();

const metrics = ledger.metrics as Record<string, Metric>;

const cards: ExperienceCard[] = (ledger.cards as Record<string, unknown>[])
  .map((card) => ({
    id: String(card.id),
    title: String(card.title),
    status: card.status as LedgerStatus,
    affiliation: String(card.affiliation),
    role: String(card.role),
    period: (card.period ?? { start: null, end: null, asOf: null }) as ExperienceCard["period"],
    headline: String(card.headline),
    highlights: (card.highlights ?? []) as string[],
    teamContext: (card.teamContext as string | null) ?? null,
    metricIds: (card.metricIds ?? []) as string[],
    tags: (card.tags ?? []) as string[],
    useFor: (card.useFor ?? []) as string[],
    excludeFor: (card.excludeFor ?? []) as string[],
    relatedCards: (card.relatedCards ?? []) as string[],
    projectSlugs: (card.projectSlugs ?? []) as string[],
    evidence: (card.evidence ?? []) as Evidence[],
    canonical: (card.canonical ?? []) as string[],
    forbidden: (card.forbidden ?? []) as string[],
    openQuestions: (card.openQuestions ?? []) as string[],
    publicOnSite: card.publicOnSite === true,
    order: typeof card.order === "number" ? card.order : 99,
    body: String(card.body ?? ""),
  }))
  .sort((a, b) => a.order - b.order);

type AffiliationSource = {
  id: string;
  kind: string;
  organization: string;
  role: string;
  start: string;
  end: string | null;
  endLabel: string | null;
  summary: string;
  tags: string[];
  cardIds: string[];
  status: LedgerStatus;
  showInTimeline: boolean;
  order: number;
};

const affiliations = (ledger.affiliations as AffiliationSource[])
  .slice()
  .sort((a, b) => a.order - b.order);

/** `2024.12 ~ 재직 중`, `2026.02 ~ 2026.05 수료` 처럼 표기합니다. */
export function formatAffiliationPeriod(affiliation: {
  start: string;
  end: string | null;
  endLabel: string | null;
}): string {
  const start = formatYearMonth(affiliation.start);
  if (!affiliation.end) return `${start} ~ ${affiliation.endLabel ?? "진행 중"}`;
  const end = formatYearMonth(affiliation.end);
  return affiliation.endLabel ? `${start} ~ ${end} ${affiliation.endLabel}` : `${start} ~ ${end}`;
}

/** 수치를 레지스트리 값으로 채운 문장을 돌려줍니다. */
export function fillMetrics(text: string): string {
  return resolveMetricTokens(text, metrics);
}

/** 첫 화면 수치. 값과 조건, 그리고 그 수치를 만든 경험 카드를 함께 돌려줍니다. */
export function getHeadlineMetrics(
  ids: string[],
): (Metric & { id: string; cardId: string | null })[] {
  return ids.map((id) => {
    const metric = getMetric(id);
    const owner = metric.cardIds.find((cardId) => getCard(cardId)?.publicOnSite);
    return { ...metric, id, cardId: owner ?? null };
  });
}

export function getMetrics(): Record<string, Metric> {
  return metrics;
}

export function getMetric(id: string): Metric {
  const metric = metrics[id];
  if (!metric) throw new Error(`unknown metric: ${id}`);
  return metric;
}

/**
 * `bems-plants`의 조건에 적힌 사업장 이름. 장면·이름표·캡션이 원장과 같은 이름을 쓰게 합니다.
 * 구분자는 앞뒤에 공백이 있는 가운뎃점입니다. "남양주(1·2)"처럼 이름 안의 가운뎃점은 나누지 않습니다.
 */
export function getPlantNames(): string[] {
  return (getMetric("bems-plants").condition ?? "")
    .split(/\s·\s/u)
    .map((name) => name.trim())
    .filter(Boolean);
}

/** 사이트에 노출하기로 한 카드만 돌려줍니다. */
export function getPublicCards(): ExperienceCard[] {
  return cards.filter((card) => card.publicOnSite);
}

export function getAllCards(): ExperienceCard[] {
  return cards;
}

export function getCard(id: string): ExperienceCard | null {
  return cards.find((card) => card.id === id) ?? null;
}

/** 이 프로젝트 사례를 만들어 낸 경험 카드. 프로젝트와 경험을 양방향으로 잇습니다. */
export function getCardsForProject(slug: string): ExperienceCard[] {
  return cards.filter((card) => card.publicOnSite && card.projectSlugs.includes(slug));
}

/** 카드 본문을 HTML로 만듭니다. 수치는 먼저 레지스트리 값으로 채웁니다. */
export function renderCardBody(card: ExperienceCard): string {
  return marked.parse(fillMetrics(card.body)) as string;
}

/** 카드가 인용할 수 있는 수치를, 화면에 붙일 수 있는 형태로 돌려줍니다. */
export function getCardMetrics(card: ExperienceCard): (Metric & { id: string })[] {
  return card.metricIds
    .map((id) => ({ id, ...metrics[id] }))
    .filter((metric) => metric.status !== "미확정");
}

/**
 * 홈 화면 타임라인. 항목을 손으로 적지 않고 경험 카드에서 만들어,
 * 카드를 고치면 화면이 따라오게 합니다.
 */
export function getTimeline(): TimelineEntry[] {
  const byId = new Map(cards.map((card) => [card.id, card]));

  return affiliations
    .filter((affiliation) => affiliation.showInTimeline)
    .map((affiliation) => {
      /*
       * 한 카드는 한 시기에만 나옵니다. `cardIds`는 "관련 있는 카드"라 여러 시기가
       * 같은 카드를 가리킬 수 있고(AI Elite와 빙그레가 BEMS를 함께 가리킵니다),
       * 그대로 그리면 같은 일이 두 번 한 것처럼 보입니다.
       */
      const owned = affiliation.cardIds
        .map((id) => byId.get(id))
        .filter(
          (card): card is ExperienceCard =>
            card !== undefined && card.publicOnSite && card.affiliation === affiliation.id,
        );

      return {
        id: affiliation.id,
        kind: affiliation.kind,
        period: formatAffiliationPeriod(affiliation),
        organization: affiliation.organization,
        role: affiliation.role,
        summary: affiliation.summary,
        items: owned.map((card) => ({
          cardId: card.id,
          title: card.title,
          headline: fillMetrics(card.headline),
          highlights: owned.length === 1 ? card.highlights.map(fillMetrics) : [],
          status: card.status,
        })),
        tags: affiliation.tags,
      };
    });
}

export function getAffiliations(): AffiliationSource[] {
  return affiliations;
}

export function getOpenQuestions() {
  return ledger.openQuestions as {
    id: string;
    topic: string;
    state: string;
    rule: string;
    relates: string[];
    blocking: boolean;
  }[];
}

export function getSelectionGuide() {
  return ledger.selectionGuide as {
    job: string;
    primary: string[];
    secondary: string[];
    exclude: string[];
    excludeReason: string;
  }[];
}

export function getPhrases() {
  return ledger.phrases as {
    preferred: { use: string; insteadOf: string[]; cardIds: string[]; reason: string }[];
    forbidden: { pattern: string; reason: string; cardIds: string[] }[];
    recompute: { field: string; rule: string; from: string }[];
  };
}

type Facts = {
  person: { name: string; nameEn: string; email: string; githubUrl: string };
  schools: {
    id: string; school: string; campus: string | null; degree: string; major: string;
    start: string; end: string; graduation: string; gpa: string | null; credits: number | null;
  }[];
  military: { branch: string; start: string; end: string; rank: string; discharge: string };
  certifications: { name: string; issuer: string; date: string }[];
  languages: { test: string; language: string; grade: string; date: string }[];
};

export function getFacts(): Facts {
  return ledger.facts as Facts;
}

/** `2018-03-01` → `2018.03` */
function ym(date: string): string {
  return formatYearMonth(date.length > 7 ? date.slice(0, 7) : date);
}

/**
 * 홈 화면 아래의 기본 이력표. 학력·자격·어학·병역을 화면에 다시 적지 않고
 * 원장의 facts에서 만듭니다.
 */
export function getQualifications(): { label: string; title: string; detail: string }[] {
  const facts = getFacts();
  const degree = facts.schools.find((school) => school.degree === "학사");
  const rows: { label: string; title: string; detail: string }[] = [];

  if (degree) {
    rows.push({
      label: "학력",
      title: `${degree.school} ${degree.major} ${degree.degree}`,
      detail: [
        `${ym(degree.start)} 입학 · ${ym(degree.end)} ${degree.graduation}`,
        degree.gpa ? `학점 ${degree.gpa}` : null,
        degree.credits ? `이수 ${degree.credits}학점` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  if (facts.certifications.length > 0) {
    rows.push({
      label: "자격증",
      title: facts.certifications
        .map((item) => item.name.replace(/\(.*\)/, "").trim())
        .join(" · "),
      detail: facts.certifications
        .map((item) => `${item.name.replace(/\(.*\)/, "").trim()} ${ym(item.date)} 취득`)
        .join(" · "),
    });
  }

  for (const language of facts.languages) {
    rows.push({
      label: "어학",
      title: `${language.test} ${language.language} ${language.grade.replace(/\s*\(.*\)/, "")}`,
      detail: `${ym(language.date)} 응시 · ${language.grade}`,
    });
  }

  rows.push({
    label: "병역",
    title: `${facts.military.branch} ${facts.military.rank} ${facts.military.discharge}`,
    detail: `${ym(facts.military.start)} 입대 · ${ym(facts.military.end)} 전역`,
  });

  return rows;
}

export function getEducation() {
  return ledger.education;
}
