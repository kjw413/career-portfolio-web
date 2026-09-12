/**
 * 3D 장면과 같은 구도의 정적 이미지를 만듭니다.
 *
 * 이 포스터는 3D를 켜지 않는 환경(모션 축소, WebGL2 미지원, 저메모리, 좁은 화면,
 * 청크 로드 실패)에서 그대로 남는 그림입니다. 장면을 고치면 이 스크립트를 다시 돌려
 * 포스터도 함께 갱신해야, 두 그림이 갈라지지 않습니다.
 *
 *   npm run build && node scripts/render-hero-poster.mjs
 *
 * 장면이 켜지지 않는 환경에서 실행하면 아무것도 쓰지 않고 그 사실을 알립니다.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "out");
/** 밝은 화면과 어두운 화면에서 각각 쓰는 포스터. 한쪽만 만들면 다른 쪽이 어색해집니다. */
const TARGETS = [
  { scheme: "light", file: path.join(ROOT, "public/hero-poster.webp") },
  { scheme: "dark", file: path.join(ROOT, "public/hero-poster-dark.webp") },
];
const PORT = 4399;
const VIEWPORT = { width: 1600, height: 1000 };

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
  if (!fs.existsSync(path.join(OUT_DIR, "index.html"))) {
    throw new Error("out/index.html이 없습니다. `npm run build`를 먼저 실행하세요.");
  }

  const require = createRequire(import.meta.url);
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    throw new Error(
      "playwright가 필요합니다. 이 스크립트는 배포에 쓰이지 않고 포스터를 다시 만들 때만 씁니다.\n" +
        "  npm i -D playwright && npx playwright install chromium\n" +
        "브라우저 경로를 직접 줄 수도 있습니다: CHROMIUM_PATH=/path/to/chromium npm run poster",
    );
  }
  const server = await serve();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });

  try {
    for (const { scheme, file } of TARGETS) {
      await renderPoster(browser, scheme, file);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

async function renderPoster(browser, scheme, file) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: scheme });
  try {
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });

    const support = await page.evaluate(() => ({
      webgl2: Boolean(document.createElement("canvas").getContext("webgl2")),
      memory: navigator.deviceMemory ?? null,
      width: window.innerWidth,
    }));
    if (!support.webgl2) {
      throw new Error(
        "이 환경에서는 WebGL2를 쓸 수 없어 포스터를 만들 수 없습니다. " +
          "GPU가 있는 환경에서 실행하거나 --use-gl=swiftshader 를 확인하세요.",
      );
    }

    // 장면은 화면에 들어와야 켜집니다. 포스터를 찍으려면 먼저 그 자리로 갑니다.
    await page.locator(".scene-section").scrollIntoViewIfNeeded();

    const canvas = page.locator(".hero-scene-canvas canvas");
    await canvas.waitFor({ state: "attached", timeout: 20000 });
    // 펄스가 한 바퀴 돌아 장면이 자리 잡을 때까지 둡니다.
    await page.waitForTimeout(2600);

    /*
     * 캔버스는 투명 배경으로 그리고 그 아래에 지난 포스터가 깔려 있습니다.
     * 그대로 찍으면 옛 그림이 비쳐 매번 겹쳐집니다. 찍기 전에 반드시 가립니다.
     */
    await page.evaluate(() => {
      const poster = document.querySelector(".hero-scene-frame img");
      if (poster instanceof HTMLElement) poster.style.visibility = "hidden";
    });
    await page.waitForTimeout(120);

    const shot = await page.locator(".hero-scene-frame").screenshot({ type: "png" });

    // Playwright는 webp로 저장하지 못하므로, 브라우저의 2D 캔버스로 변환합니다.
    const webp = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const target = document.createElement("canvas");
      target.width = image.naturalWidth;
      target.height = image.naturalHeight;
      target.getContext("2d").drawImage(image, 0, 0);
      return target.toDataURL("image/webp", 0.88).split(",")[1];
    }, shot.toString("base64"));

    fs.writeFileSync(file, Buffer.from(webp, "base64"));
    const size = fs.statSync(file).size;
    console.log(`${path.relative(ROOT, file)} (${(size / 1024).toFixed(1)} KB, ${scheme})`);

    const stats = await page.evaluate(() => window.__heroSceneStats ?? null);
    if (stats) {
      console.log(
        `  삼각형 ${stats.triangles.toLocaleString()}개 · 메시 ${stats.meshes}개 · draw call ${stats.drawCalls}회`,
      );
    }
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
