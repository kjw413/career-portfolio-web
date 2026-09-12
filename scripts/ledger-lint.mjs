/**
 * 원장 검증 + 공개 콘텐츠 검사.
 *
 * `npm run build` 앞에서 돌기 때문에, 여기서 잡히는 것은 배포되지 않습니다.
 * 두 가지를 봅니다.
 *   1. 원장 자체의 무결성 — 참조 깨짐, 확정 전 수치 노출, 날짜 형식, 개인정보
 *   2. 사이트가 실제로 보여 주는 글 — 폐기된 수치와 금지 표현이 다시 들어왔는지
 *
 * 원장 폴더 자체는 2번 검사에서 제외합니다. 금지 표현 목록이 거기에 있기 때문입니다.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  readApplications,
  readLedger,
  readProjectSlugs,
  validateApplications,
  validateLedger,
} from "../lib/ledger-core.mjs";

/** 방문자와 AI가 실제로 읽는 파일. 원장 폴더는 규칙의 출처라 제외합니다. */
function publishedFiles(root) {
  const files = [
    "content/profile.json",
    "content/project-overrides.json",
    "README.md",
  ].filter((file) => fs.existsSync(path.join(root, file)));

  const collect = (dir, test) => {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) return [];
    return fs
      .readdirSync(full, { withFileTypes: true })
      .flatMap((entry) => {
        const relative = path.join(dir, entry.name);
        if (entry.isDirectory()) return collect(relative, test);
        return test(entry.name) ? [relative] : [];
      });
  };

  return [
    ...files,
    ...collect("content/projects", (name) => name.endsWith(".md")),
    ...collect("public/projects", (name) => name.endsWith(".svg")),
    ...collect("app", (name) => name.endsWith(".tsx") && !name.includes(".test.")),
  ];
}

/** 조사와 공백 차이로 빠져나가지 않도록 공백을 지우고 비교합니다. */
function normalize(text) {
  return text.replace(/\s+/gu, "");
}

export function lintPublishedContent(root, ledger) {
  const findings = [];
  const retired = Object.entries(ledger.metrics).flatMap(([id, metric]) =>
    (metric.deprecated ?? []).map((value) => ({ id, value, use: metric.display })),
  );
  const forbidden = [
    ...ledger.phrases.forbidden.map((entry) => ({ pattern: entry.pattern, reason: entry.reason })),
    ...ledger.cards.flatMap((card) =>
      (card.forbidden ?? []).map((pattern) => ({ pattern, reason: `${card.id}의 금지 표현` })),
    ),
  ];

  for (const file of publishedFiles(root)) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const squashed = normalize(source);

    for (const { id, value, use } of retired) {
      if (squashed.includes(normalize(value))) {
        findings.push(`${file}: 폐기된 수치 "${value}" — ${id}의 "${use}"를 씁니다`);
      }
    }
    for (const { pattern, reason } of forbidden) {
      if (squashed.includes(normalize(pattern))) {
        findings.push(`${file}: 금지 표현 "${pattern}" — ${reason}`);
      }
    }
  }

  return findings;
}

export function runLint(root = process.cwd()) {
  const ledger = readLedger(root);
  const ledgerErrors = [
    ...validateLedger(ledger, { projectSlugs: readProjectSlugs(root) }),
    ...validateApplications(readApplications(root), ledger),
  ];
  const contentFindings = ledgerErrors.length > 0 ? [] : lintPublishedContent(root, ledger);
  return { ledgerErrors, contentFindings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ledgerErrors, contentFindings } = runLint();

  if (ledgerErrors.length > 0) {
    console.error(`원장 검증 실패 (${ledgerErrors.length}건)`);
    for (const error of ledgerErrors) console.error(`  - ${error}`);
  }
  if (contentFindings.length > 0) {
    console.error(`공개 콘텐츠 검사 실패 (${contentFindings.length}건)`);
    for (const finding of contentFindings) console.error(`  - ${finding}`);
  }

  if (ledgerErrors.length > 0 || contentFindings.length > 0) process.exit(1);
  console.log("원장 검증 통과: 참조·상태·날짜·개인정보, 제출 이력, 공개 콘텐츠의 폐기 수치·금지 표현");
}
