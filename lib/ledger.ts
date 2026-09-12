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

/** 홈 화면의 경력·교육 아코디언이 쓰는 형태. 항목 본문은 카드에서 생성합니다. */
export type Experience = {
  id: string;
  period: string;
  organization: string;
  role: string;
  summary: string;
  details: string[];
  tags: string[];
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

export function getMetrics(): Record<string, Metric> {
  return metrics;
}

export function getMetric(id: string): Metric {
  const metric = metrics[id];
  if (!metric) throw new Error(`unknown metric: ${id}`);
  return metric;
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
 * 한 소속에 카드가 여럿이면 카드마다 결과 한 줄을 보여 주고, 카드가 하나뿐이면
 * 그 카드가 곧 그 시기의 전부이므로 세부 항목을 펼쳐 보여 줍니다.
 */
function detailsFor(cards: ExperienceCard[]): string[] {
  if (cards.length === 1 && cards[0].highlights.length > 0) {
    return cards[0].highlights.map(fillMetrics);
  }
  return cards.map((card) => fillMetrics(card.headline));
}

/**
 * 홈 화면의 경력·교육 항목. 세부 항목은 손으로 적지 않고 카드의 headline에서 만들어,
 * 카드를 고치면 화면이 따라오게 합니다.
 */
export function getExperiences(): Experience[] {
  const byId = new Map(cards.map((card) => [card.id, card]));

  return affiliations
    .filter((affiliation) => affiliation.showInTimeline)
    .map((affiliation) => ({
      id: affiliation.id,
      period: formatAffiliationPeriod(affiliation),
      organization: affiliation.organization,
      role: affiliation.role,
      summary: affiliation.summary,
      details: detailsFor(
        affiliation.cardIds
          .map((id) => byId.get(id))
          .filter((card): card is ExperienceCard => card !== undefined && card.publicOnSite),
      ),
      tags: affiliation.tags,
    }));
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

export function getFacts() {
  return ledger.facts;
}

export function getEducation() {
  return ledger.education;
}
