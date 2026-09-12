/**
 * 원장(content/ledger) 읽기와 검증.
 *
 * 사실·수치·표현 규칙은 이 폴더에서만 씁니다. 사이트 화면, AI용 JSON, 드라이브 미러는
 * 전부 여기서 생성되므로, 여기서 막지 못한 오류는 세 곳에 동시에 퍼집니다. 그래서
 * 참조 깨짐과 확정 전 수치 노출은 경고가 아니라 빌드 실패로 다룹니다.
 *
 * 앱(TypeScript)과 스크립트(.mjs)가 같은 구현을 쓰도록 여기에 한 번만 작성합니다.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const STATUSES = ["확정", "부분확정", "미확정", "진행중"];
const DATE = /^\d{4}-\d{2}(-\d{2})?$/;
const METRIC_TOKEN = /\{\{metric:([A-Za-z0-9-]+)(?:\|([a-zA-Z]+))?\}\}/g;

/** 저장소에 들어오면 안 되는 개인정보. 실수로 붙여 넣은 값을 빌드에서 잡습니다. */
const PRIVATE_PATTERNS = [
  { label: "휴대전화번호", pattern: /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/ },
  { label: "주민등록번호", pattern: /\b\d{6}[-\s]?[1-4]\d{6}\b/ },
  { label: "상세주소", pattern: /\d+동\s?\d+호/ },
  { label: "생년월일", pattern: /\b19\d{2}[.\-/]\s?\d{2}[.\-/]\s?\d{2}\b/ },
];

function readJson(root, relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function listCardFiles(root) {
  const dir = path.join(root, "content/ledger/experiences");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .sort();
}

/** 검증 없이 원장 파일을 그대로 읽습니다. 검증은 `validateLedger`가 합니다. */
export function readLedger(root = process.cwd()) {
  const cards = listCardFiles(root).map((file) => {
    const raw = fs.readFileSync(path.join(root, "content/ledger/experiences", file), "utf8");
    const { data, content } = matter(raw);
    return { ...data, fileName: file, body: content.trim() };
  });

  return {
    metrics: readJson(root, "content/ledger/metrics.json"),
    phrases: readJson(root, "content/ledger/phrases.json"),
    facts: readJson(root, "content/ledger/facts.json"),
    education: readJson(root, "content/ledger/education.json"),
    affiliations: readJson(root, "content/ledger/affiliations.json"),
    selectionGuide: readJson(root, "content/ledger/selection-guide.json"),
    openQuestions: readJson(root, "content/ledger/open-questions.json"),
    cards,
  };
}

/** 제출 이력 manifest. 본문은 드라이브에만 있고 여기에는 메타데이터만 있습니다. */
export function readApplications(root = process.cwd()) {
  const file = path.join(root, "content/applications/index.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
}

/**
 * 제출 이력이 원장과 어긋나지 않는지 봅니다.
 * 회사명은 공개 저장소에 두지 않으므로 여기서도 막습니다.
 */
export function validateApplications(applications, ledger) {
  const errors = [];
  const cardIds = new Set(ledger.cards.map((card) => card.id));
  const metricIds = new Set(Object.keys(ledger.metrics));
  const jobNames = new Set(ledger.selectionGuide.map((item) => item.job));
  const seen = new Set();

  for (const application of applications) {
    const label = `applications.${application.id}`;
    if (seen.has(application.id)) errors.push(`${label}: id가 중복됩니다`);
    seen.add(application.id);

    if (!jobNames.has(application.jobFamily)) {
      errors.push(`${label}: 존재하지 않는 직무군 "${application.jobFamily}"`);
    }
    checkDate(application.submittedAt ?? null, `${label}.submittedAt`, errors);
    if (typeof application.analyzed !== "boolean") {
      errors.push(`${label}: analyzed는 true 또는 false여야 합니다`);
    }

    const guide = ledger.selectionGuide.find((item) => item.job === application.jobFamily);
    for (const question of application.questions ?? []) {
      const where = `${label}.questions[${question.no}]`;
      checkIdList(question.cardIds ?? [], cardIds, `${where}.cardIds`, errors, "카드");
      checkIdList(question.metricIds ?? [], metricIds, `${where}.metricIds`, errors, "수치");
      for (const id of question.cardIds ?? []) {
        if (guide?.exclude.includes(id)) {
          errors.push(`${where}: ${id}는 "${application.jobFamily}" 직무의 기본 제외 카드입니다`);
        }
      }
    }
    if (application.analyzed && (application.questions ?? []).length === 0) {
      errors.push(`${label}: 본문을 확인했다면 문항별 사용 카드를 적습니다`);
    }

    const text = JSON.stringify(application);
    for (const { label: kind, pattern } of PRIVATE_PATTERNS) {
      if (pattern.test(text)) errors.push(`${label}: ${kind}로 보이는 값이 있습니다`);
    }
  }

  return errors;
}

/** `content/projects/*.md`의 slug 목록. 카드가 가리키는 사례가 실제로 있는지 확인합니다. */
export function readProjectSlugs(root = process.cwd()) {
  return fs
    .readdirSync(path.join(root, "content/projects"))
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => file.replace(/\.md$/, ""));
}

/** 본문에서 인용한 수치 ID를 모두 찾습니다. */
export function metricTokensIn(text) {
  return [...String(text ?? "").matchAll(METRIC_TOKEN)].map((match) => ({
    token: match[0],
    id: match[1],
    field: match[2] ?? "display",
  }));
}

/**
 * `{{metric:id}}`를 레지스트리 값으로 채웁니다.
 * `{{metric:id|label}}`처럼 다른 필드도 인용할 수 있습니다.
 */
export function resolveMetricTokens(text, metrics) {
  return String(text ?? "").replace(METRIC_TOKEN, (token, id, field) => {
    const metric = metrics[id];
    if (!metric) throw new Error(`unknown metric token: ${token}`);
    const value = metric[field ?? "display"];
    if (value === undefined || value === null) {
      throw new Error(`metric ${id} has no field "${field ?? "display"}"`);
    }
    return String(value);
  });
}

function checkDate(value, label, errors) {
  if (value === null || value === undefined) return;
  if (typeof value !== "string" || !DATE.test(value)) {
    errors.push(`${label}: 날짜는 YYYY-MM 또는 YYYY-MM-DD여야 합니다 (${value})`);
  }
}

function checkIdList(list, known, label, errors, kind) {
  if (!Array.isArray(list)) {
    errors.push(`${label}: 배열이어야 합니다`);
    return;
  }
  for (const id of list) {
    if (!known.has(id)) errors.push(`${label}: 존재하지 않는 ${kind} "${id}"`);
  }
}

/**
 * 원장 전체를 검사하고 사람이 읽을 수 있는 오류 목록을 돌려줍니다.
 * 빈 배열이면 통과입니다.
 */
export function validateLedger(ledger, { projectSlugs = [] } = {}) {
  const errors = [];
  const metricIds = new Set(Object.keys(ledger.metrics));
  const cardIds = new Set(ledger.cards.map((card) => card.id));
  const eduIds = new Set(ledger.education.map((item) => item.id));
  const affiliationIds = new Set(ledger.affiliations.map((item) => item.id));
  const questionIds = new Set(ledger.openQuestions.map((item) => item.id));
  const jobNames = new Set(ledger.selectionGuide.map((item) => item.job));
  const slugs = new Set(projectSlugs);

  // ── 수치 레지스트리 ────────────────────────────────────────
  for (const [id, metric] of Object.entries(ledger.metrics)) {
    const label = `metrics.${id}`;
    if (!metric.display) errors.push(`${label}: display가 필요합니다`);
    if (!metric.label) errors.push(`${label}: label이 필요합니다`);
    if (!STATUSES.includes(metric.status)) {
      errors.push(`${label}: status는 ${STATUSES.join(" | ")} 중 하나여야 합니다`);
    }
    if (!metric.basis) errors.push(`${label}: basis(근거)가 필요합니다`);
    checkDate(metric.confirmedAt ?? null, `${label}.confirmedAt`, errors);
    checkIdList(metric.cardIds ?? [], cardIds, `${label}.cardIds`, errors, "카드");
    checkIdList(metric.doNotConfuseWith ?? [], metricIds, `${label}.doNotConfuseWith`, errors, "수치");
  }

  // ── 경험 카드 ─────────────────────────────────────────────
  for (const card of ledger.cards) {
    const label = `experiences/${card.fileName}`;
    if (card.id !== card.fileName.replace(/\.md$/, "")) {
      errors.push(`${label}: id(${card.id})와 파일명이 다릅니다`);
    }
    for (const field of ["title", "role", "headline"]) {
      if (!card[field]) errors.push(`${label}: ${field}가 필요합니다`);
    }
    if (!STATUSES.includes(card.status)) {
      errors.push(`${label}: status는 ${STATUSES.join(" | ")} 중 하나여야 합니다`);
    }
    if (!affiliationIds.has(card.affiliation)) {
      errors.push(`${label}: 존재하지 않는 소속 "${card.affiliation}"`);
    }
    if (typeof card.publicOnSite !== "boolean") {
      errors.push(`${label}: publicOnSite는 true 또는 false여야 합니다`);
    }

    const period = card.period ?? {};
    checkDate(period.start ?? null, `${label}.period.start`, errors);
    checkDate(period.end ?? null, `${label}.period.end`, errors);
    checkDate(period.asOf ?? null, `${label}.period.asOf`, errors);
    if (period.start && period.end && period.start > period.end) {
      errors.push(`${label}: period.start가 period.end보다 늦습니다`);
    }

    checkIdList(card.metricIds ?? [], metricIds, `${label}.metricIds`, errors, "수치");
    checkIdList(card.relatedCards ?? [], cardIds, `${label}.relatedCards`, errors, "카드");
    checkIdList(card.projectSlugs ?? [], slugs, `${label}.projectSlugs`, errors, "프로젝트");
    checkIdList(card.openQuestions ?? [], questionIds, `${label}.openQuestions`, errors, "확인 항목");
    checkIdList(card.useFor ?? [], jobNames, `${label}.useFor`, errors, "직무군");
    checkIdList(card.excludeFor ?? [], jobNames, `${label}.excludeFor`, errors, "직무군");

    const highlights = card.highlights ?? [];
    if (!Array.isArray(highlights)) {
      errors.push(`${label}: highlights는 배열이어야 합니다`);
    } else if (card.publicOnSite && (highlights.length < 1 || highlights.length > 4)) {
      errors.push(`${label}: 공개 카드의 highlights는 1~4개여야 합니다 (현재 ${highlights.length}개)`);
    }

    const quoted = [
      ...metricTokensIn(card.headline),
      ...(Array.isArray(highlights) ? highlights : []).flatMap((line) => metricTokensIn(line)),
      ...metricTokensIn(card.body),
    ];
    for (const { token, id, field } of quoted) {
      const metric = ledger.metrics[id];
      if (!metric) {
        errors.push(`${label}: 존재하지 않는 수치를 인용했습니다 ${token}`);
        continue;
      }
      if (metric[field] === undefined || metric[field] === null) {
        errors.push(`${label}: 수치 ${id}에 "${field}" 필드가 없습니다`);
      }
      if (card.publicOnSite && metric.status === "미확정") {
        errors.push(`${label}: 확정되지 않은 수치 ${id}를 공개 카드에서 인용했습니다`);
      }
      if (!(card.metricIds ?? []).includes(id)) {
        errors.push(`${label}: 본문에서 인용한 수치 ${id}가 metricIds에 없습니다`);
      }
    }

    if (!/^##\s+수행\s*$/m.test(card.body)) {
      errors.push(`${label}: 본문에 "## 수행" 절이 필요합니다`);
    }
    if (card.status === "확정" && !/^##\s+성과\s*$/m.test(card.body)) {
      errors.push(`${label}: 확정 카드에는 "## 성과" 절이 필요합니다`);
    }
    if (card.publicOnSite && card.status === "미확정") {
      errors.push(`${label}: 미확정 카드는 사이트에 노출하지 않습니다`);
    }
  }

  // ── 소속(타임라인) ────────────────────────────────────────
  const orders = new Set();
  for (const affiliation of ledger.affiliations) {
    const label = `affiliations.${affiliation.id}`;
    if (!affiliation.organization) errors.push(`${label}: organization이 필요합니다`);
    if (!affiliation.role) errors.push(`${label}: role이 필요합니다`);
    if (!STATUSES.includes(affiliation.status)) {
      errors.push(`${label}: status는 ${STATUSES.join(" | ")} 중 하나여야 합니다`);
    }
    checkDate(affiliation.start ?? null, `${label}.start`, errors);
    checkDate(affiliation.end ?? null, `${label}.end`, errors);
    if (affiliation.start && affiliation.end && affiliation.start > affiliation.end) {
      errors.push(`${label}: start가 end보다 늦습니다`);
    }
    checkIdList(affiliation.cardIds ?? [], cardIds, `${label}.cardIds`, errors, "카드");
    if (affiliation.eduId && !eduIds.has(affiliation.eduId)) {
      errors.push(`${label}: 존재하지 않는 교육 "${affiliation.eduId}"`);
    }
    if (orders.has(affiliation.order)) errors.push(`${label}: order ${affiliation.order}가 중복됩니다`);
    orders.add(affiliation.order);
  }

  for (const card of ledger.cards) {
    const owner = ledger.affiliations.find((item) => item.id === card.affiliation);
    if (owner && !(owner.cardIds ?? []).includes(card.id)) {
      errors.push(`affiliations.${owner.id}: 소속 카드 ${card.id}가 cardIds에 없습니다`);
    }
  }

  // ── 교육 ─────────────────────────────────────────────────
  for (const item of ledger.education) {
    const label = `education.${item.id}`;
    if (!item.name) errors.push(`${label}: name이 필요합니다`);
    if (!STATUSES.includes(item.status)) {
      errors.push(`${label}: status는 ${STATUSES.join(" | ")} 중 하나여야 합니다`);
    }
    checkDate(item.start ?? null, `${label}.start`, errors);
    checkDate(item.end ?? null, `${label}.end`, errors);
    checkIdList(item.cardIds ?? [], cardIds, `${label}.cardIds`, errors, "카드");
    checkIdList(item.useFor ?? [], jobNames, `${label}.useFor`, errors, "직무군");
    checkIdList(item.excludeFor ?? [], jobNames, `${label}.excludeFor`, errors, "직무군");
  }

  // ── 직무별 선택 가이드 ────────────────────────────────────
  for (const guide of ledger.selectionGuide) {
    const label = `selection-guide.${guide.job}`;
    checkIdList(guide.primary ?? [], cardIds, `${label}.primary`, errors, "카드");
    checkIdList(guide.secondary ?? [], cardIds, `${label}.secondary`, errors, "카드");
    checkIdList(guide.exclude ?? [], cardIds, `${label}.exclude`, errors, "카드");
    const chosen = new Set([...(guide.primary ?? []), ...(guide.secondary ?? [])]);
    for (const id of guide.exclude ?? []) {
      if (chosen.has(id)) errors.push(`${label}: ${id}가 사용 대상이면서 제외 대상입니다`);
    }
  }

  // ── 확인이 필요한 항목 ────────────────────────────────────
  for (const question of ledger.openQuestions) {
    const label = `open-questions.${question.id}`;
    if (!question.rule) errors.push(`${label}: rule(처리 규칙)이 필요합니다`);
    if (typeof question.blocking !== "boolean") {
      errors.push(`${label}: blocking은 true 또는 false여야 합니다`);
    }
    for (const ref of question.relates ?? []) {
      const known =
        cardIds.has(ref) || metricIds.has(ref) || eduIds.has(ref) || ref.startsWith("facts.");
      if (!known) errors.push(`${label}: 알 수 없는 참조 "${ref}"`);
    }
  }

  // ── 표현 규칙 ────────────────────────────────────────────
  for (const entry of ledger.phrases.forbidden ?? []) {
    if (!entry.pattern) errors.push("phrases.forbidden: pattern이 필요합니다");
    if (!entry.reason) errors.push(`phrases.forbidden(${entry.pattern}): reason이 필요합니다`);
    checkIdList(entry.cardIds ?? [], cardIds, `phrases.forbidden(${entry.pattern}).cardIds`, errors, "카드");
  }
  for (const entry of ledger.phrases.preferred ?? []) {
    checkIdList(entry.cardIds ?? [], cardIds, `phrases.preferred(${entry.use}).cardIds`, errors, "카드");
  }

  // ── 개인정보 ─────────────────────────────────────────────
  const scanned = [
    ...ledger.cards.map((card) => [`experiences/${card.fileName}`, `${card.headline}\n${card.body}`]),
    ["facts.json", JSON.stringify(ledger.facts)],
    ["education.json", JSON.stringify(ledger.education)],
  ];
  for (const [label, text] of scanned) {
    for (const { label: kind, pattern } of PRIVATE_PATTERNS) {
      if (pattern.test(text)) errors.push(`${label}: ${kind}로 보이는 값이 있습니다. 저장소에 두지 않습니다`);
    }
  }

  return errors;
}

/** 읽고 검증한 뒤 돌려줍니다. 오류가 하나라도 있으면 던집니다. */
export function loadLedger(root = process.cwd()) {
  const ledger = readLedger(root);
  const errors = [
    ...validateLedger(ledger, { projectSlugs: readProjectSlugs(root) }),
    ...validateApplications(readApplications(root), ledger),
  ];
  if (errors.length > 0) {
    throw new Error(`원장 검증 실패 (${errors.length}건)\n  - ${errors.join("\n  - ")}`);
  }
  return ledger;
}
