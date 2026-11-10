/**
 * 포트폴리오 PDF를 만듭니다.
 *
 * 빌더 화면(/builder)을 헤드리스 브라우저로 열어 그대로 인쇄합니다. 그래서 브라우저에서
 * 고른 구성과 같은 문서가 나오고, 문서의 사실은 전부 원장(content/ledger)에서 옵니다.
 * PDF에 들어갈 문장을 이 스크립트에 적지 않습니다.
 *
 *   npm run build
 *   npm run pdf                                          # 공개 기본 PDF → public/portfolio.pdf
 *   npm run portfolio -- --job "제조 AI·데이터" --ref a07   # 직무군 프리셋
 *   npm run portfolio -- --cards EXP-BG-ENERGY-WEB.d,EXP-BG-DATA-RPA.s --hide skills
 *   npm run portfolio -- --url "<빌더에서 복사한 구성 링크>"
 *
 * 옵션
 *   --job <직무군>      selection-guide.json의 직무군. 1순위는 상세, 보조는 요약으로 싣습니다
 *   --cards <목록>      쉼표로 나눈 `ID.d`(상세) · `ID.s`(요약). 적은 순서대로 싣습니다
 *   --hide <섹션>       summary,metrics,history,qualifications,skills 중 끌 것
 *   --ref <코드>        문서 속 사이트 링크에 ?ref=코드를 붙입니다(방문 통계의 유입 구분)
 *   --date <YYYY-MM-DD> 재직기간을 계산할 기준일. 기본은 오늘
 *   --contact <문구>    저장소에 없는 연락처(전화번호 등). 이 PDF에만 들어갑니다
 *   --url <링크>        빌더의 "구성 링크 복사"로 받은 주소. 위 구성 옵션 대신 씁니다
 *   --out <경로>        저장할 곳
 *   --public            공개 기본 PDF(public/portfolio.pdf)를 다시 만듭니다
 *
 * 회사별 PDF는 portfolio-out/에 떨어지고, 이 폴더는 .gitignore에 있어 커밋되지 않습니다.
 * 공개 PDF에는 추적 코드와 추가 연락처를 넣을 수 없습니다.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "out");
const PUBLIC_PDF = path.join(ROOT, "public", "portfolio.pdf");
const PRIVATE_DIR = path.join(ROOT, "portfolio-out");
const PORT = 4398;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
};

const VALUE_OPTIONS = ["job", "cards", "hide", "ref", "date", "contact", "url", "out"];

function parseArgs(argv) {
  const options = { public: false };
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index].replace(/^--/, "");
    if (name === "public") {
      options.public = true;
    } else if (VALUE_OPTIONS.includes(name) && argv[index + 1] !== undefined) {
      options[name] = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`알 수 없는 옵션이거나 값이 없습니다: ${argv[index]}`);
    }
  }
  return options;
}

/** 옵션을 빌더 주소의 쿼리로 바꿉니다. 형식은 lib/portfolio-selection.ts의 encodeSelection과 같습니다. */
function buildQuery(options) {
  if (options.url) {
    const search = options.url.includes("?") ? options.url.slice(options.url.indexOf("?") + 1) : options.url;
    return new URLSearchParams(search);
  }
  const params = new URLSearchParams();
  if (options.job) params.set("job", options.job);
  if (options.cards) params.set("m", options.cards);
  if (options.hide) params.set("hide", options.hide);
  if (options.ref) params.set("ref", options.ref);
  if (options.date) params.set("date", options.date);
  return params;
}

function serve() {
  const server = http.createServer((request, response) => {
    const requested = decodeURIComponent((request.url ?? "/").split("?")[0]);
    let file = path.join(OUT_DIR, requested);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, {
      "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
    });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

function loadChromium() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright").chromium;
  } catch {
    throw new Error(
      "playwright가 필요합니다. 이 스크립트는 배포에 쓰이지 않고 PDF를 만들 때만 씁니다.\n" +
        "  npm i -D playwright && npx playwright install chromium\n" +
        "브라우저 경로를 직접 줄 수도 있습니다: CHROMIUM_PATH=/path/to/chromium npm run pdf",
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const params = buildQuery(options);

  if (options.public && (params.has("ref") || options.contact)) {
    throw new Error("공개 PDF에는 추적 코드(--ref)와 추가 연락처(--contact)를 넣지 않습니다.");
  }
  if (!fs.existsSync(path.join(OUT_DIR, "builder", "index.html"))) {
    throw new Error("out/builder/index.html이 없습니다. `npm run build`를 먼저 실행하세요.");
  }

  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "profile.json"), "utf8"));
  const ref = params.get("ref") ?? "";
  const target = options.out
    ? path.resolve(ROOT, options.out)
    : options.public
      ? PUBLIC_PDF
      : path.join(PRIVATE_DIR, ref, `${profile.name}_포트폴리오.pdf`);

  const chromium = loadChromium();
  const server = await serve();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // 추가 연락처는 주소에 싣지 않습니다. 빌더가 읽는 자리(localStorage)에 넣어 줍니다.
    await context.addInitScript((contact) => {
      if (contact) window.localStorage.setItem("portfolio-builder:contact", contact);
      else window.localStorage.removeItem("portfolio-builder:contact");
    }, options.contact ?? "");

    const page = await context.newPage();
    const query = params.toString();
    await page.goto(`http://localhost:${PORT}/builder/${query ? `?${query}` : ""}`, {
      waitUntil: "networkidle",
    });
    await page.locator(".pf-doc").waitFor({ state: "attached", timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));

    // 빌더는 모르는 카드와 잘못된 값을 조용히 버립니다. 무엇이 실제로 실렸는지 되읽어 알립니다.
    const report = await page.evaluate(() => ({
      search: window.location.search,
      items: [...document.querySelectorAll(".pf-item")].map((item) => ({
        id: item.getAttribute("data-module"),
        level: item.getAttribute("data-level"),
        title: item.querySelector("h3")?.firstChild?.textContent ?? "",
      })),
      warnings: [...document.querySelectorAll(".pf-warnings li")].map((item) => item.textContent ?? ""),
      notes: [...document.querySelectorAll(".pf-block .pf-hint")]
        .map((item) => item.textContent ?? "")
        .filter((text) => text.startsWith("사이트에 공개하지 않아")),
    }));

    const requested = (params.get("m") ?? "")
      .split(",")
      .map((part) => (part.includes(".") ? part.slice(0, part.lastIndexOf(".")) : part))
      .filter(Boolean);
    const dropped = requested.filter((id) => !report.items.some((item) => item.id === id));
    if (params.get("job") && !new URLSearchParams(report.search).get("job")) {
      throw new Error(`모르는 직무군입니다: ${params.get("job")} (content/ledger/selection-guide.json의 job)`);
    }
    if (dropped.length > 0) {
      throw new Error(`실을 수 없는 항목입니다(공개 카드나 프로젝트 사례가 아님): ${dropped.join(", ")}`);
    }
    if (report.items.length === 0) {
      throw new Error("실을 경험이 하나도 없습니다. --job, --cards, --url 가운데 하나를 확인하세요.");
    }

    await page.emulateMedia({ media: "print" });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await page.pdf({ path: target, format: "A4", printBackground: true, preferCSSPageSize: true });

    const pages = (fs.readFileSync(target, "latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
    const size = (fs.statSync(target).size / 1024).toFixed(0);
    console.log(`${path.relative(ROOT, target)} (${pages ? `${pages}쪽 · ` : ""}${size} KB)`);
    for (const [index, item] of report.items.entries()) {
      console.log(`  ${String(index + 1).padStart(2, "0")} ${item.level === "detail" ? "상세" : "요약"}  ${item.title} (${item.id})`);
    }
    for (const note of report.notes) console.log(`  참고: ${note}`);
    if (report.warnings.length > 0) {
      console.log("  제출 전 확인:");
      for (const warning of report.warnings) console.log(`   - ${warning}`);
    }
    console.log(`  다시 열기: /builder/${report.search}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
