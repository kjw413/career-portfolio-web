/**
 * 이력서 PDF(public/portfolio.pdf)와 포트폴리오 PDF(public/portfolio-cases.pdf)를 만듭니다.
 *
 * 사이트의 /resume/, /casebook/ 페이지를 Chromium으로 A4 인쇄합니다. /casebook/은 화면에서 구성을
 * 골라 브라우저로 저장할 수도 있어서, 기본 구성과 별도로 모든 프로젝트를 넣은 최대 구성도 한 번
 * 인쇄해 어느 쪽도 넘치지 않는지, 최대 구성도 2MB 안인지 확인하고 결과를
 * public/portfolio-cases.meta.json에 남깁니다(화면이 읽어 예상 용량으로 보여 줌). 페이지가 원장·프로필·프로젝트에서
 * 내용을 읽으므로, 사실을 고친 뒤 이 스크립트를 다시 돌리면 PDF도 같은 값으로 바뀝니다.
 * 글꼴은 PDF 안에 함께 들어가므로 받는 쪽 컴퓨터에 한글 글꼴이 없어도 그대로 보입니다.
 *
 *   npm run build && npm run pdf
 *
 * 이전에는 글꼴을 넣지 않은 PDF를 직접 써서, Chrome에서 영문 자간이 벌어지고(G i t H u b)
 * 받는 환경에 따라 글자가 비어 보였습니다.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "out");
const PORT = 4398;

/**
 * 일부 기업(현대자동차 등)은 포트폴리오를 2MB 이하 PDF로만 받습니다. 넘으면 실패시켜,
 * 이미지를 늘리다가 제출할 수 없는 파일이 사이트에 올라가는 일을 막습니다.
 * 같은 한도를 app/casebook.test.ts도 검사합니다.
 */
const MAX_PDF_BYTES = 2 * 1024 * 1024;

const TARGETS = [
  { route: "/resume/", output: "public/portfolio.pdf", maxBytes: MAX_PDF_BYTES },
  {
    route: "/casebook/",
    output: "public/portfolio-cases.pdf",
    maxBytes: MAX_PDF_BYTES,
    // 장마다 높이를 A4 한 쪽으로 고정하므로, 내용이 넘치면 잘리지 않게 여기서 멈춥니다.
    fixedPages: ".cb-page",
    // 화면이 주소(?p=…)를 읽은 뒤 켜는 표시. 켜지기 전에 인쇄하면 기본 구성이 찍힙니다.
    ready: "[data-casebook-ready='true']",
    // 모든 프로젝트 · 모든 항목. 어떤 조합도 이보다 길거나 크지 않습니다.
    maxRoute: "/casebook/?p=all",
    meta: "public/portfolio-cases.meta.json",
  },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

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

/** 페이지를 열고 글꼴·그림이 다 붙을 때까지 기다린 뒤 인쇄해, 파일 크기와 쪽수를 돌려줍니다. */
async function render(browser, url, output, target) {
  const page = await browser.newPage({ colorScheme: "light" });
  try {
    await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: "networkidle" });
    if (target.ready) await page.waitForSelector(target.ready, { state: "attached" });
    // 웹폰트는 렌더를 막지 않도록 늦게 붙습니다(layout.tsx). 다 붙은 뒤에 인쇄합니다.
    await page.evaluate(async () => {
      for (const link of document.querySelectorAll("link[data-webfont]")) link.media = "all";
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((image) =>
          image.complete ? null : new Promise((resolve) => image.addEventListener("load", resolve, { once: true })),
        ),
      );
    });
    const loaded = await page.evaluate(() =>
      [...document.fonts].some(
        (face) => face.family.replace(/["']/g, "") === "Pretendard Variable" && face.status === "loaded",
      ),
    );
    if (!loaded) {
      console.warn(
        "웹폰트(Pretendard Variable)를 받지 못했습니다. 이 PC에 Pretendard가 설치돼 있지 않으면 " +
          "시스템 한글 글꼴로 인쇄됩니다. 네트워크를 확인하세요.",
      );
    }
    await page.emulateMedia({ media: "print" });

    let expectedPages = null;
    if (target.fixedPages) {
      const overflow = await page.evaluate((selector) => {
        const sheets = [...document.querySelectorAll(selector)];
        return {
          count: sheets.length,
          over: sheets
            .map((sheet, index) => ({
              index: index + 1,
              title: sheet.querySelector(".cb-title, .resume-name")?.textContent?.trim() ?? "",
              by: sheet.scrollHeight - sheet.clientHeight,
            }))
            .filter((sheet) => sheet.by > 1),
        };
      }, target.fixedPages);
      if (overflow.over.length > 0) {
        const list = overflow.over.map((sheet) => `  ${sheet.index}쪽 ${sheet.title}: ${sheet.by}px 넘침`).join("\n");
        throw new Error(`${url} 내용이 A4 한 쪽을 넘었습니다. 문장을 줄이세요.\n${list}`);
      }
      expectedPages = overflow.count;
    }

    await page.pdf({ path: output, format: "A4", printBackground: true, preferCSSPageSize: true });
    const bytes = fs.statSync(output).size;
    const pages = (fs.readFileSync(output, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    if (expectedPages !== null && pages !== expectedPages) {
      throw new Error(`${url}: ${expectedPages}쪽이어야 하는데 ${pages}쪽입니다. 빈 쪽이나 넘친 쪽을 확인하세요.`);
    }
    if (bytes > target.maxBytes) {
      throw new Error(
        `${url}: ${(bytes / 1024).toFixed(0)}KB로 한도 ${(target.maxBytes / 1024 / 1024).toFixed(0)}MB를 넘었습니다. ` +
          "사례 이미지를 줄이거나 SVG로 바꾸세요.",
      );
    }
    return { bytes, pages };
  } finally {
    await page.close();
  }
}

async function print(browser, target) {
  const output = path.join(ROOT, target.output);
  const result = await render(browser, target.route, output, target);
  console.log(`Generated ${target.output} (${result.pages} pages, ${(result.bytes / 1024).toFixed(0)}KB)`);

  if (target.maxRoute) {
    const scratch = path.join(OUT_DIR, "_max-check.pdf");
    try {
      const max = await render(browser, target.maxRoute, scratch, target);
      console.log(`Checked ${target.maxRoute} (${max.pages} pages, ${(max.bytes / 1024).toFixed(0)}KB)`);
      if (target.meta) {
        const meta = {
          maxBytes: target.maxBytes,
          defaultPages: result.pages,
          defaultBytes: result.bytes,
          allPages: max.pages,
          allBytes: max.bytes,
          generatedAt: new Date().toISOString().slice(0, 10),
        };
        fs.writeFileSync(path.join(ROOT, target.meta), `${JSON.stringify(meta, null, 2)}\n`);
      }
    } finally {
      fs.rmSync(scratch, { force: true });
    }
  }
}

async function main() {
  for (const target of TARGETS) {
    if (!fs.existsSync(path.join(OUT_DIR, target.route, "index.html"))) {
      throw new Error(`out${target.route}index.html이 없습니다. \`npm run build\`를 먼저 실행하세요.`);
    }
  }

  const require = createRequire(import.meta.url);
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    throw new Error(
      "playwright가 필요합니다. 이 스크립트는 배포에 쓰이지 않고 PDF를 다시 만들 때만 씁니다.\n" +
        "  npm i -D playwright && npx playwright install chromium\n" +
        "브라우저 경로를 직접 줄 수도 있습니다: CHROMIUM_PATH=/path/to/chromium npm run pdf",
    );
  }

  const server = await serve();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    for (const target of TARGETS) await print(browser, target);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
