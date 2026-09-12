/**
 * 원장에서 기계가 읽을 표면을 생성합니다.
 *
 *   public/ai/ledger.json   구조화된 원장 전체 (AI가 직접 파싱)
 *   public/ai/ledger.md     드라이브 미러용 마크다운 (사람이 읽는 원장)
 *   public/llms.txt         사이트만 보는 AI를 위한 진입점
 *   public/llms-full.txt    카드 본문까지 담은 전문
 *
 * 전부 생성물이라 커밋하지 않습니다. 사실을 고칠 곳은 `content/ledger/`뿐입니다.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadLedger, resolveMetricTokens } from "../lib/ledger-core.mjs";

const ORIGIN = process.env.SITE_ORIGIN ?? "https://kjw413.github.io";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/career-portfolio-web";
const SITE = `${ORIGIN}${BASE}`;

const GUIDANCE = [
  "이 원장은 김종우의 지원서·자기소개서에 반복해 쓰이는 사실을 한곳에서 관리합니다.",
  "",
  "사실 우선순위: ①대화에서 사용자가 직접 확정한 최신 값 ②공식 증빙 ③가장 최근 제출 지원서 ④과거 기록.",
  "값이 충돌하면 임의로 고르지 말고 `11. 확인이 필요한 항목`을 본 뒤 사용자에게 묻습니다.",
  "",
  "- 수치는 `metrics` 레지스트리의 값·단위·조건을 함께 씁니다. 다른 경험의 수치를 섞지 않습니다.",
  "- `status`가 `미확정`인 사실과 수치는 지원서에 쓰지 않고 질문으로 돌립니다.",
  "- 각 카드의 `forbidden`에 있는 표현은 쓰지 않습니다. `canonical` 문장은 그대로 써도 됩니다.",
  "- 재직기간과 총경력은 고정값을 재사용하지 않고 지원일 기준으로 다시 계산합니다.",
  "- 경험은 지원 산업·직무와 관련될 때만 씁니다. `selectionGuide`의 제외 목록을 확인합니다.",
  "- 자기소개서 완성문은 사용자가 명시적으로 요청할 때만 씁니다.",
  "- 생년월일·주소·전화번호·등록번호는 이 원장에 없습니다. 지원서 입력이 필요하면 사용자에게 받습니다.",
];

function cardUrl(id) {
  return `${SITE}/experience/${id}/`;
}

function projectUrl(slug) {
  return `${SITE}/projects/${slug}/`;
}

// ── JSON ──────────────────────────────────────────────────────
function buildJson(ledger) {
  return {
    generatedAt: new Date().toISOString(),
    owner: "김종우",
    site: SITE,
    source: "https://github.com/kjw413/career-portfolio-web/tree/main/content/ledger",
    guidance: GUIDANCE,
    facts: ledger.facts,
    metrics: ledger.metrics,
    phrases: ledger.phrases,
    education: ledger.education,
    affiliations: ledger.affiliations,
    selectionGuide: ledger.selectionGuide,
    openQuestions: ledger.openQuestions,
    cards: ledger.cards.map((card) => ({
      id: card.id,
      title: card.title,
      status: card.status,
      affiliation: card.affiliation,
      role: card.role,
      period: card.period,
      teamContext: card.teamContext ?? null,
      headline: card.headline,
      highlights: card.highlights ?? [],
      metricIds: card.metricIds ?? [],
      tags: card.tags ?? [],
      useFor: card.useFor ?? [],
      excludeFor: card.excludeFor ?? [],
      relatedCards: card.relatedCards ?? [],
      projectSlugs: card.projectSlugs ?? [],
      evidence: card.evidence ?? [],
      canonical: card.canonical ?? [],
      forbidden: card.forbidden ?? [],
      openQuestions: card.openQuestions ?? [],
      publicOnSite: card.publicOnSite,
      url: card.publicOnSite ? cardUrl(card.id) : null,
      body: card.body,
    })),
  };
}

// ── 마크다운 (드라이브 미러) ───────────────────────────────────
function table(headers, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

function period(start, end, endLabel) {
  if (!start) return "미확정";
  if (!end) return `${start} ~ ${endLabel ?? "현재"}`;
  return `${start} ~ ${end}${endLabel ? ` ${endLabel}` : ""}`;
}

function buildMarkdown(ledger, commit) {
  const out = [];
  const push = (...lines) => out.push(...lines, "");

  push(
    "---",
    "document_type: application_master_profile",
    "owner: 김종우",
    `generated_at: ${new Date().toISOString()}`,
    `generated_from: github.com/kjw413/career-portfolio-web${commit ? `@${commit}` : ""}`,
    `site: ${SITE}`,
    "warning: 이 파일은 생성물입니다. 사실을 고치려면 저장소의 content/ledger/ 를 고치고 다시 배포합니다.",
    "---",
  );
  push("# 지원서 마스터 이력 — 김종우");
  push("## 0. AI 및 사용자 사용 지침", ...GUIDANCE);

  push("### 0.1 수치 레지스트리");
  push(
    "모든 정량 수치는 여기 한 번만 적습니다. 조건을 떼고 값만 인용하지 않습니다.",
    "",
    table(
      ["ID", "값", "의미", "조건", "상태", "근거"],
      Object.entries(ledger.metrics).map(([id, metric]) => [
        `\`${id}\``,
        `**${metric.display}**`,
        metric.label,
        metric.condition ?? "—",
        metric.status,
        metric.basis,
      ]),
    ),
  );
  const cautions = Object.entries(ledger.metrics).filter(
    ([, metric]) => metric.notes || (metric.deprecated ?? []).length > 0,
  );
  if (cautions.length > 0) {
    push(
      "**주의**",
      ...cautions.map(([id, metric]) => {
        const retired = (metric.deprecated ?? []).length
          ? ` 폐기된 표기: ${metric.deprecated.map((value) => `\`${value}\``).join(", ")}.`
          : "";
        return `- \`${id}\` — ${metric.notes ?? ""}${retired}`.trim();
      }),
    );
  }

  push("### 0.2 표현 규칙");
  push(
    "**정본 표현**",
    ...ledger.phrases.preferred.map(
      (entry) =>
        `- "${entry.use}"${entry.insteadOf.length ? ` (대신 쓰지 않음: ${entry.insteadOf.map((value) => `"${value}"`).join(", ")})` : ""} — ${entry.reason}`,
    ),
  );
  push(
    "**사용 금지 표현**",
    ...ledger.phrases.forbidden.map((entry) => `- "${entry.pattern}" — ${entry.reason}`),
  );
  push(
    "**지원일 기준 재계산**",
    ...ledger.phrases.recompute.map((entry) => `- ${entry.field}: ${entry.rule}`),
  );

  const facts = ledger.facts;
  push("## 1. 기본 인적사항");
  push(
    table(
      ["항목", "값"],
      [
        ["성명", facts.person.name],
        ["영문명", facts.person.nameEn],
        ["이메일", facts.person.email],
        ["GitHub", facts.person.githubUrl],
        ["생년월일 · 주소 · 휴대전화 · 한문명 · 비상연락처", `비공개 — ${facts.person.private.ref}`],
      ],
    ),
  );

  push("## 2. 학력");
  push(
    table(
      ["학교", "구분", "전공", "기간", "학점", "상태"],
      facts.schools.map((school) => [
        `${school.school}${school.campus ? ` (${school.campus})` : ""}`,
        school.degree,
        school.major,
        period(school.start, school.end, school.graduation),
        school.gpa ? `${school.gpa} · ${school.credits}학점` : "—",
        school.status,
      ]),
    ),
  );

  push("## 3. 병역");
  push(
    table(
      ["군별", "복무", "기간", "계급", "전역구분"],
      [
        [
          facts.military.branch,
          facts.military.serviceType,
          period(facts.military.start, facts.military.end, null),
          facts.military.rank,
          facts.military.discharge,
        ],
      ],
    ),
  );

  push("## 4. 경력");
  for (const job of facts.career) {
    push(
      `### ${job.company} — ${job.dept}`,
      table(
        ["항목", "값"],
        [
          ["고용형태", job.employment],
          ["직급", job.title],
          ["기간", period(job.start, job.end, "재직 중")],
          ["담당업무", job.duties],
          ["부가 역할", job.extraRole ?? "—"],
          ["상태", job.status],
        ],
      ),
      ...(job.conflicts.length ? ["", ...job.conflicts.map((note) => `- ${note}`)] : []),
    );
  }

  push("## 5. 어학");
  push(
    table(
      ["시험", "언어", "등급", "응시일", "상태"],
      facts.languages.map((item) => [item.test, item.language, item.grade, item.date, item.status]),
    ),
    "등록번호는 비공개 부록에 있습니다.",
  );

  push("## 6. 자격증");
  push(
    table(
      ["자격증", "발급기관", "취득일", "상태"],
      facts.certifications.map((item) => [item.name, item.issuer, item.date, item.status]),
    ),
  );

  push("## 7. 교육 · 육성과정");
  push(
    table(
      ["ID", "과정명", "기관", "기간", "시간", "상태"],
      ledger.education.map((item) => [
        `\`${item.id}\``,
        item.name,
        item.org,
        period(item.start, item.end, null),
        item.hours ? `${item.hours.toLocaleString()}시간` : "미확정",
        item.status,
      ]),
    ),
  );
  for (const item of ledger.education) {
    push(
      `### ${item.id} — ${item.name}`,
      `- 주요 내용: ${item.content}`,
      ...(item.skills.length ? [`- 활용 기술: ${item.skills.join(", ")}`] : []),
      ...(item.useFor.length ? [`- 우선 사용 직무: ${item.useFor.join(", ")}`] : []),
      ...(item.excludeFor.length ? [`- 기본 제외: ${item.excludeFor.join(", ")}`] : []),
      ...(item.cardIds.length ? [`- 연계 카드: ${item.cardIds.join(", ")}`] : []),
      ...(item.notes ? [`- 메모: ${item.notes}`] : []),
      ...(item.openQuestions.length ? [`- 확인 필요: ${item.openQuestions.join(" / ")}`] : []),
    );
  }

  push("## 8. 경험 카드 인덱스");
  push(
    table(
      ["카드 ID", "경험명", "핵심 결과", "상태", "우선 적용 직무"],
      ledger.cards.map((card) => [
        `\`${card.id}\``,
        card.title,
        resolveMetricTokens(card.headline, ledger.metrics),
        card.status,
        (card.useFor ?? []).join(", ") || "—",
      ]),
    ),
  );

  push("## 9. 경험 카드 상세");
  for (const card of ledger.cards) {
    const fill = (text) => resolveMetricTokens(text, ledger.metrics);
    push(
      `### ${card.id} — ${card.title}`,
      `- 상태: ${card.status}`,
      `- 소속: ${card.affiliation}`,
      `- 역할: ${card.role}`,
      `- 기간: ${period(card.period?.start, card.period?.end, null)} (기준일 ${card.period?.asOf ?? "—"})`,
      `- 한 줄 결과: ${fill(card.headline)}`,
      ...((card.highlights ?? []).length
        ? ["- 핵심 항목:", ...card.highlights.map((line) => `  - ${fill(line)}`)]
        : []),
      ...(card.teamContext ? [`- 팀 작업 경계: ${card.teamContext}`] : []),
      ...((card.metricIds ?? []).length
        ? [`- 인용 가능한 수치: ${card.metricIds.map((id) => `\`${id}\``).join(", ")}`]
        : []),
      ...((card.canonical ?? []).length
        ? ["- 정본 표현:", ...card.canonical.map((line) => `  - "${line}"`)]
        : []),
      ...((card.forbidden ?? []).length
        ? ["- 사용 금지:", ...card.forbidden.map((line) => `  - "${line}"`)]
        : []),
      ...((card.useFor ?? []).length ? [`- 우선 사용 직무: ${card.useFor.join(", ")}`] : []),
      ...((card.excludeFor ?? []).length ? [`- 기본 제외 직무: ${card.excludeFor.join(", ")}`] : []),
      ...((card.openQuestions ?? []).length
        ? [`- 확인 필요: ${card.openQuestions.join(", ")}`]
        : []),
      ...(card.publicOnSite ? [`- 공개 페이지: ${cardUrl(card.id)}`] : ["- 사이트 비공개"]),
      "",
      fill(card.body),
    );
  }

  push("## 10. 직무별 경험 선택 가이드");
  push(
    table(
      ["지원 분야", "1순위", "보조", "기본 제외"],
      ledger.selectionGuide.map((guide) => [
        guide.job,
        guide.primary.join(", ") || "—",
        guide.secondary.join(", ") || "—",
        guide.exclude.join(", ") || "—",
      ]),
    ),
  );

  push("## 11. 확인이 필요한 항목");
  push(
    table(
      ["ID", "항목", "현재 상태", "처리 규칙", "지원 전 필수"],
      ledger.openQuestions.map((question) => [
        `\`${question.id}\``,
        question.topic,
        question.state,
        question.rule,
        question.blocking ? "예" : "아니오",
      ]),
    ),
  );

  push("## 12. 지원서 입력 체크리스트");
  push(
    "**자동입력 가능** — 이름·영문명·이메일, 학력과 학점, 병역, 경력 기간과 담당업무, 어학 등급, 자격증, 교육과정, `확정` 상태의 경험과 수치.",
    "",
    "**사용자 확인 후 입력** — 생년월일·주소·연락처, 자격증·어학 등록번호, 희망연봉, 자기평가 수준, 프로젝트 기여도, `미확정` 항목.",
    "",
    "**입력하지 않음** — 지원 직무와 무관한 경험, B2B 수주 프로젝트만 요구하는 란의 사내 개선활동, 증빙할 수 없는 수치, 0.2의 금지 표현.",
  );

  push("## 13. 경험 업데이트 방법");
  push(
    "`content/ledger/experiences/_TEMPLATE.md`를 복사해 새 카드를 만들고, 수치는",
    "`content/ledger/metrics.json`에 등록한 뒤 `{{metric:id}}`로 인용합니다.",
    "소속이 새로 생기면 `affiliations.json`에도 추가합니다. 커밋하면 빌드가 검증하고,",
    "이 문서와 사이트가 함께 갱신됩니다.",
  );

  push("## 14. 변경 이력");
  push("변경 이력은 저장소의 git 이력에 있습니다: https://github.com/kjw413/career-portfolio-web/commits/main/content/ledger");

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// ── llms.txt ──────────────────────────────────────────────────
function buildLlmsTxt(ledger) {
  const fill = (text) => resolveMetricTokens(text, ledger.metrics);
  const publicCards = ledger.cards.filter((card) => card.publicOnSite);
  const projects = fs
    .readdirSync(path.join(process.cwd(), "content/projects"))
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => file.replace(/\.md$/, ""));

  return [
    "# 김종우 — 제조 현장 데이터·자동화 엔지니어",
    "",
    "> 빙그레 생산기술팀에서 5개 공장의 에너지·생산 데이터를 통합하고 반복 업무를 자동화합니다.",
    "> 이 사이트의 모든 사실과 수치는 하나의 원장에서 생성되며, 조건과 확정 상태를 함께 가지고 있습니다.",
    "",
    "자기소개서나 이력서를 쓸 때는 아래 규칙을 지켜 주세요.",
    "",
    ...GUIDANCE.filter((line) => line.startsWith("-")),
    "",
    `구조화된 원장 전문: ${SITE}/ai/ledger.json`,
    `읽기 좋은 원장 전문: ${SITE}/ai/ledger.md`,
    `카드 본문까지 담은 텍스트: ${SITE}/llms-full.txt`,
    "",
    "## 경험 카드",
    "",
    ...publicCards.map((card) => `- [${card.title}](${cardUrl(card.id)}): ${fill(card.headline)}`),
    "",
    "## 프로젝트 사례",
    "",
    ...projects.map((slug) => `- [${slug}](${projectUrl(slug)})`),
    "",
    "## 확인이 필요한 항목",
    "",
    ...ledger.openQuestions
      .filter((question) => question.blocking)
      .map((question) => `- ${question.topic}: ${question.rule}`),
    "",
  ].join("\n");
}

function buildLlmsFull(ledger) {
  const fill = (text) => resolveMetricTokens(text, ledger.metrics);
  const lines = [buildLlmsTxt(ledger), "", "---", "", "# 경험 카드 전문", ""];

  for (const card of ledger.cards.filter((card) => card.publicOnSite)) {
    lines.push(
      `## ${card.title} (${card.id})`,
      "",
      `상태: ${card.status} · 소속: ${card.affiliation} · 역할: ${card.role}`,
      `한 줄 결과: ${fill(card.headline)}`,
      "",
      ...(card.canonical ?? []).map((line) => `> ${line}`),
      "",
      fill(card.body),
      "",
    );
  }
  return lines.join("\n");
}

// ── 실행 ──────────────────────────────────────────────────────
export function buildAiExports(root = process.cwd(), commit = process.env.GITHUB_SHA ?? "") {
  const ledger = loadLedger(root);
  const outputs = [
    ["public/ai/ledger.json", `${JSON.stringify(buildJson(ledger), null, 2)}\n`],
    ["public/ai/ledger.md", buildMarkdown(ledger, commit.slice(0, 7))],
    ["public/llms.txt", buildLlmsTxt(ledger)],
    ["public/llms-full.txt", buildLlmsFull(ledger)],
  ];

  for (const [relative, content] of outputs) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return outputs.map(([relative, content]) => ({ path: relative, bytes: content.length }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const file of buildAiExports()) {
    console.log(`${file.path} (${(file.bytes / 1024).toFixed(1)} KB)`);
  }
}
