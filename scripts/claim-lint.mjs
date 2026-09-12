/**
 * 자기소개서 본문을 사실 원장과 대조합니다.
 *
 * 제출하고 나면 고칠 수 없으므로, 제출 전에 다음을 잡는 것이 목적입니다.
 *   - 원장과 다른 수치 (7% 와 7.3% 처럼 조건이 달라 값이 갈리는 경우)
 *   - 폐기하기로 한 옛 표기
 *   - 쓰지 않기로 한 표현
 *   - 확정되지 않은 수치
 *   - 그 직무에 쓰지 않기로 한 경험
 *   - 지원일 기준으로 다시 계산해야 하는 재직기간
 *
 * 사용:
 *   node scripts/claim-lint.mjs --file 초안.txt --job "제조 AI·데이터" --date 2026-09-12
 *   cat 초안.txt | node scripts/claim-lint.mjs --job "에너지·유틸리티"
 */

import fs from "node:fs";
import process from "node:process";
import { readLedger } from "../lib/ledger-core.mjs";

const NUMBER = /(\d+(?:[.,]\d+)?)\s*(%p|%|시간|분|초|개월|년|개월|개|명|배|회|건|공장)/g;
const TENURE = /(?:총\s*경력|재직(?:기간)?|경력)\D{0,12}?(\d+)\s*년(?:\s*(\d+)\s*개월)?/g;
const CONTEXT = 46;

// ── 텍스트 도구 ────────────────────────────────────────────────
const squash = (text) => text.replace(/\s+/gu, "");

/** 조사와 어미 차이로 빠져나가지 않도록, 글자 3-gram이 얼마나 겹치는지 봅니다. */
function similarity(a, b) {
  const grams = (text) => {
    const set = new Set();
    for (let i = 0; i + 3 <= text.length; i += 1) set.add(text.slice(i, i + 3));
    return set;
  };
  const left = grams(a);
  const right = grams(b);
  if (left.size === 0 || right.size === 0) return a === b ? 1 : 0;

  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  return shared / Math.min(left.size, right.size);
}

/** 같은 길이의 창을 밀어 가며, 어딘가에 비슷한 문장이 있는지 봅니다. */
function containsSimilar(haystack, needle, threshold = 0.78) {
  const target = squash(needle);
  const text = squash(haystack);
  if (text.includes(target)) return 1;
  if (target.length < 8) return 0;

  const step = Math.max(1, Math.floor(target.length / 8));
  let best = 0;
  for (let i = 0; i + target.length * 0.7 <= text.length; i += step) {
    const window = text.slice(i, i + Math.ceil(target.length * 1.25));
    best = Math.max(best, similarity(window, target));
    if (best >= threshold) return best;
  }
  return best >= threshold ? best : 0;
}

function words(...values) {
  return values
    .flat()
    .filter(Boolean)
    .join(" ")
    .split(/[^0-9A-Za-z가-힣]+/u)
    .filter((word) => word.length >= 2);
}

// ── 수치 ───────────────────────────────────────────────────────
function metricCandidates(metrics) {
  return Object.entries(metrics).map(([id, metric]) => ({
    id,
    metric,
    unit: metric.unit ?? null,
    terms: [...new Set(words(metric.aliases ?? [], metric.label, metric.condition ?? ""))],
  }));
}

/** 문맥에 얼마나 많은 단서가 겹치는지로 어떤 수치를 말한 것인지 고릅니다. */
function pickMetric(candidates, unit, context) {
  const scored = candidates
    .filter((candidate) => !unit || !candidate.unit || candidate.unit === unit)
    .map((candidate) => ({
      ...candidate,
      score: candidate.terms.reduce((sum, term) => sum + (context.includes(term) ? 1 : 0), 0),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}

function checkNumbers(text, ledger, findings) {
  const candidates = metricCandidates(ledger.metrics);

  for (const match of text.matchAll(NUMBER)) {
    const written = Number(match[1].replace(",", ""));
    const unit = match[2];
    const at = match.index ?? 0;
    const context = text.slice(Math.max(0, at - CONTEXT), at + CONTEXT);
    const quote = match[0];

    const best = pickMetric(candidates, unit, context);
    if (!best) {
      findings.push({
        level: "info",
        kind: "미등록 수치",
        quote,
        detail: "원장에 없는 수치입니다. 근거가 있으면 metrics.json에 등록하세요.",
        context,
      });
      continue;
    }

    const registered = typeof best.metric.value === "number" ? best.metric.value : null;
    if (best.metric.status === "미확정") {
      findings.push({
        level: "error",
        kind: "확정 전 수치",
        quote,
        detail: `${best.id}는 아직 확정되지 않았습니다. ${best.metric.notes ?? "확인 전에는 쓰지 않습니다."}`,
        context,
      });
      continue;
    }
    /*
     * 합계와 내역을 함께 쓰는 수치가 있습니다. system-collab-count 는 "2건"이지만
     * 조건에 "MIS 1건 + MES 1건"이 들어 있고, 그렇게 나눠 쓰는 것이 권장 표기입니다.
     * 원장이 스스로 적어 둔 내역과 같은 값이면 어긋난 것이 아닙니다.
     */
    const breakdown = `${best.metric.display} ${best.metric.condition ?? ""}`;
    if (breakdown.includes(quote.replace(/\s+/g, "")) || breakdown.includes(quote)) continue;

    if (registered !== null && Math.abs(registered - written) > 0.001) {
      findings.push({
        level: "error",
        kind: "수치 불일치",
        quote,
        detail:
          `문맥은 ${best.id}(${best.metric.label})를 가리키는데 값이 다릅니다. ` +
          `원장 값은 ${best.metric.display}이고 조건은 "${best.metric.condition ?? "—"}"입니다.` +
          (best.metric.notes ? ` ${best.metric.notes}` : ""),
        context,
      });
    }
  }
}

function checkRetired(text, ledger, findings) {
  for (const [id, metric] of Object.entries(ledger.metrics)) {
    for (const retired of metric.deprecated ?? []) {
      if (squash(text).includes(squash(retired))) {
        findings.push({
          level: "error",
          kind: "폐기된 표기",
          quote: retired,
          detail: `${id}의 현재 표기는 "${metric.display}"입니다.`,
        });
      }
    }
  }
}

function checkForbidden(text, ledger, findings) {
  const rules = [
    ...ledger.phrases.forbidden.map((entry) => ({ ...entry, source: "표현 규칙" })),
    ...ledger.cards.flatMap((card) =>
      (card.forbidden ?? []).map((pattern) => ({
        pattern,
        reason: `${card.id}가 금지한 표현입니다.`,
        source: card.id,
      })),
    ),
  ];

  for (const rule of rules) {
    const score = containsSimilar(text, rule.pattern);
    if (score > 0) {
      findings.push({
        level: "error",
        kind: "금지 표현",
        quote: rule.pattern,
        detail: `${rule.reason} (유사도 ${(score * 100).toFixed(0)}%, 출처 ${rule.source})`,
      });
    }
  }
}

function checkPreferred(text, ledger, findings) {
  for (const rule of ledger.phrases.preferred ?? []) {
    for (const avoid of rule.insteadOf ?? []) {
      if (containsSimilar(text, avoid, 0.88) > 0) {
        findings.push({
          level: "warn",
          kind: "표현 교체",
          quote: avoid,
          detail: `"${rule.use}"로 씁니다. ${rule.reason}`,
        });
      }
    }
  }
}

/**
 * 본문이 어떤 경험을 썼는지 추정합니다.
 *
 * 경험명의 낱말만 단서로 씁니다. 태그와 소속명은 여러 카드가 나눠 가지고 있어,
 * 그것까지 세면 같은 회사의 다른 경험이 함께 걸립니다. 소속명은 그 소속에 카드가
 * 둘 이하일 때만, 즉 그 이름이 곧 그 경험을 가리킬 때만 단서로 씁니다.
 */
export function detectCards(text, ledger) {
  const cardsPerAffiliation = new Map();
  for (const card of ledger.cards) {
    cardsPerAffiliation.set(card.affiliation, (cardsPerAffiliation.get(card.affiliation) ?? 0) + 1);
  }

  /*
   * 여러 경험명에 함께 나오는 낱말(데이터 · 자동화 · 분석 …)은 어느 경험인지 가려 주지
   * 못합니다. 목록을 손으로 관리하지 않고, 세 개 이상의 경험명에 나오면 뺍니다.
   */
  const frequency = new Map();
  for (const card of ledger.cards) {
    for (const term of new Set(words(card.title))) {
      frequency.set(term, (frequency.get(term) ?? 0) + 1);
    }
  }
  const distinctiveTerm = (term) => (frequency.get(term) ?? 0) <= 2;

  return ledger.cards
    .map((card) => {
      const affiliation = ledger.affiliations.find((entry) => entry.id === card.affiliation);
      const distinctive =
        affiliation && (cardsPerAffiliation.get(card.affiliation) ?? 0) <= 2
          ? words(affiliation.organization)
          : [];
      const terms = [...new Set([...words(card.title).filter(distinctiveTerm), ...distinctive])];
      const hits = terms.filter((term) => text.includes(term)).length;
      return { id: card.id, hits };
    })
    .filter((card) => card.hits >= 2)
    .sort((a, b) => b.hits - a.hits)
    .map((card) => card.id);
}

function checkCardFit(usedCards, job, ledger, findings) {
  if (!job) return;
  const guide = ledger.selectionGuide.find((entry) => entry.job === job);
  if (!guide) {
    findings.push({
      level: "warn",
      kind: "직무군 미상",
      quote: job,
      detail: `selection-guide.json에 없는 직무군입니다. 쓸 수 있는 값: ${ledger.selectionGuide
        .map((entry) => entry.job)
        .join(", ")}`,
    });
    return;
  }

  for (const id of usedCards) {
    if (guide.exclude.includes(id)) {
      findings.push({
        level: "warn",
        kind: "제외 경험 사용",
        quote: id,
        detail: `"${job}"에서는 기본 제외하기로 한 경험입니다. ${guide.excludeReason}`,
      });
    }
  }
  const missing = guide.primary.filter((id) => !usedCards.includes(id));
  if (missing.length === guide.primary.length && guide.primary.length > 0) {
    findings.push({
      level: "info",
      kind: "1순위 경험 미사용",
      quote: guide.primary.join(", "),
      detail: `"${job}"의 1순위 경험이 본문에서 보이지 않습니다. 의도한 것인지 확인하세요.`,
    });
  }
}

/** 재직기간은 고정값을 재사용하지 않고 지원일 기준으로 다시 계산합니다. */
function checkTenure(text, ledger, submittedAt, findings) {
  const job = ledger.facts.career.find((entry) => entry.end === null);
  if (!job) return;

  const start = new Date(`${job.start}T00:00:00Z`);
  const asOf = new Date(`${submittedAt}T00:00:00Z`);
  let months =
    (asOf.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (asOf.getUTCMonth() - start.getUTCMonth());
  if (asOf.getUTCDate() < start.getUTCDate()) months -= 1;
  months = Math.max(months, 0);

  for (const match of text.matchAll(TENURE)) {
    const written = Number(match[1]) * 12 + Number(match[2] ?? 0);
    if (written !== months) {
      findings.push({
        level: "error",
        kind: "재직기간 불일치",
        quote: match[0].trim(),
        detail: `${submittedAt} 기준으로는 ${Math.floor(months / 12)}년 ${months % 12}개월입니다. 고정값을 재사용하지 않습니다.`,
      });
    }
  }
}

function checkOpenQuestions(usedCards, ledger, findings) {
  const blocking = new Set(
    ledger.openQuestions.filter((question) => question.blocking).map((question) => question.id),
  );
  for (const id of usedCards) {
    const card = ledger.cards.find((entry) => entry.id === id);
    for (const question of card?.openQuestions ?? []) {
      if (!blocking.has(question)) continue;
      const detail = ledger.openQuestions.find((entry) => entry.id === question);
      findings.push({
        level: "warn",
        kind: "확인 필요",
        quote: `${id} / ${question}`,
        detail: `${detail?.topic ?? question} — ${detail?.rule ?? "지원 전 확인이 필요합니다."}`,
      });
    }
  }
}

// ── 실행 ───────────────────────────────────────────────────────
export function lintCoverLetter(text, { job = null, submittedAt = null, root } = {}) {
  const ledger = readLedger(root);
  const findings = [];
  const date = submittedAt ?? new Date().toISOString().slice(0, 10);

  checkNumbers(text, ledger, findings);
  checkRetired(text, ledger, findings);
  checkForbidden(text, ledger, findings);
  checkPreferred(text, ledger, findings);
  checkTenure(text, ledger, date, findings);

  const usedCards = detectCards(text, ledger);
  checkCardFit(usedCards, job, ledger, findings);
  checkOpenQuestions(usedCards, ledger, findings);

  const rank = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => rank[a.level] - rank[b.level]);

  return {
    usedCards,
    findings,
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
  };
}

export function formatReport(result, { job, file }) {
  const icon = { error: "✗", warn: "!", info: "·" };
  const lines = [
    `# 자기소개서 검사 — ${result.status === "pass" ? "통과" : "확인 필요"}`,
    "",
    `- 대상: ${file ?? "(표준 입력)"}`,
    `- 직무군: ${job ?? "(지정 안 함)"}`,
    `- 사용한 것으로 보이는 경험: ${result.usedCards.join(", ") || "추정하지 못함"}`,
    "",
  ];

  if (result.findings.length === 0) {
    lines.push("원장과 어긋나는 점을 찾지 못했습니다.");
    return lines.join("\n");
  }

  for (const level of ["error", "warn", "info"]) {
    const group = result.findings.filter((finding) => finding.level === level);
    if (group.length === 0) continue;
    lines.push(`## ${{ error: "고쳐야 할 것", warn: "확인할 것", info: "참고" }[level]} ${group.length}건`, "");
    for (const finding of group) {
      lines.push(`${icon[level]} **${finding.kind}** — \`${finding.quote}\``);
      lines.push(`  ${finding.detail}`);
      if (finding.context) lines.push(`  문맥: …${finding.context.replace(/\s+/g, " ").trim()}…`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--file") args.file = argv[++i];
    else if (argv[i] === "--job") args.job = argv[++i];
    else if (argv[i] === "--date") args.date = argv[++i];
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const text = args.file
    ? fs.readFileSync(args.file, "utf8")
    : fs.readFileSync(0, "utf8");

  const result = lintCoverLetter(text, { job: args.job ?? null, submittedAt: args.date ?? null });
  console.log(formatReport(result, { job: args.job, file: args.file }));
  if (result.status === "fail") process.exit(1);
}
