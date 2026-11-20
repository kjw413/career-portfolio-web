/**
 * 이력서 PDF(public/portfolio.pdf)를 만듭니다.
 *
 * 사이트의 /resume/ 페이지를 Chromium으로 A4 인쇄합니다. 페이지가 원장·프로필·프로젝트에서
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
const OUTPUT = path.join(ROOT, "public", "portfolio.pdf");
const PORT = 4398;

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

async function main() {
  if (!fs.existsSync(path.join(OUT_DIR, "resume", "index.html"))) {
    throw new Error("out/resume/index.html이 없습니다. `npm run build`를 먼저 실행하세요.");
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
    const page = await browser.newPage({ colorScheme: "light" });
    await page.goto(`http://127.0.0.1:${PORT}/resume/`, { waitUntil: "networkidle" });
    // 웹폰트는 렌더를 막지 않도록 늦게 붙습니다(layout.tsx). 다 붙은 뒤에 인쇄합니다.
    await page.evaluate(async () => {
      for (const link of document.querySelectorAll("link[data-webfont]")) link.media = "all";
      await document.fonts.ready;
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
    await page.pdf({ path: OUTPUT, format: "A4", printBackground: true, preferCSSPageSize: true });
    const pages = (fs.readFileSync(OUTPUT, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    console.log(`Generated ${path.relative(ROOT, OUTPUT)} (${pages} pages)`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
