import fs from "node:fs";
import path from "node:path";

const output = path.join(process.cwd(), "public", "portfolio.pdf");

const C = {
  navy: "0.047 0.075 0.137",
  navy2: "0.075 0.110 0.190",
  ink: "0.075 0.102 0.153",
  muted: "0.380 0.420 0.490",
  line: "0.875 0.895 0.925",
  paper: "0.975 0.980 0.990",
  white: "1 1 1",
  cyan: "0.055 0.690 0.745",
  cyanSoft: "0.875 0.970 0.975",
  lime: "0.710 0.920 0.285",
  violet: "0.435 0.365 0.930",
  violetSoft: "0.930 0.920 0.990",
};

const utf16Hex = (value) => {
  const bytes = Buffer.from(`\ufeff${value}`, "utf16le");
  for (let index = 0; index < bytes.length; index += 2) {
    [bytes[index], bytes[index + 1]] = [bytes[index + 1], bytes[index]];
  }
  return bytes.toString("hex").toUpperCase();
};

const esc = (value) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");

function page() {
  const commands = [];
  const fill = (color) => commands.push(`${color} rg`);
  const stroke = (color) => commands.push(`${color} RG`);
  const rect = (x, y, width, height, color) => {
    fill(color);
    commands.push(`${x} ${y} ${width} ${height} re f`);
  };
  const line = (x1, y1, x2, y2, color, width = 1) => {
    stroke(color);
    commands.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const circle = (x, y, radius, color) => {
    const k = radius * 0.5522848;
    fill(color);
    commands.push(`${x + radius} ${y} m ${x + radius} ${y + k} ${x + k} ${y + radius} ${x} ${y + radius} c ${x - k} ${y + radius} ${x - radius} ${y + k} ${x - radius} ${y} c ${x - radius} ${y - k} ${x - k} ${y - radius} ${x} ${y - radius} c ${x + k} ${y - radius} ${x + radius} ${y - k} ${x + radius} ${y} c f`);
  };
  const text = (value, x, y, size, color = C.ink, font = "F1") => {
    fill(color);
    commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm <${utf16Hex(value)}> Tj ET`);
  };
  const latin = (value, x, y, size, color = C.ink, font = "F3") => {
    fill(color);
    commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(value)}) Tj ET`);
  };
  const pill = (label, x, y, width, color = C.cyanSoft, textColor = C.ink) => {
    rect(x, y, width, 19, color);
    latin(label, x + 8, y + 6, 7, textColor, "F4");
  };
  const number = (value, label, x, y, accent) => {
    rect(x, y, 112, 69, C.white);
    rect(x, y, 4, 69, accent);
    latin(value, x + 15, y + 36, 20, C.ink, "F4");
    text(label, x + 15, y + 17, 8, C.muted);
  };
  return { commands, rect, line, circle, text, latin, pill, number };
}

const first = page();
first.rect(0, 0, 595, 842, C.paper);
first.rect(0, 0, 178, 842, C.navy);
first.rect(0, 755, 178, 87, C.navy2);
first.circle(55, 782, 23, C.cyan);
first.latin("KJ", 43, 775, 15, C.navy, "F4");
first.text("김종우", 28, 728, 23, C.white, "F2");
first.latin("JONG WOO KIM", 29, 709, 8, C.cyan, "F4");
first.text("데이터와 시스템으로", 28, 670, 10, C.white, "F2");
first.text("현장의 문제를 해결합니다.", 28, 652, 10, C.white, "F2");

first.latin("CONTACT", 28, 600, 8, C.lime, "F4");
first.line(28, 590, 150, 590, C.navy2);
first.latin("github.com/kjw413", 28, 567, 8, C.white);
first.latin("kjw2110@naver.com", 28, 548, 8, C.white);

first.latin("CORE STACK", 28, 498, 8, C.lime, "F4");
first.line(28, 488, 150, 488, C.navy2);
for (const [label, y, width] of [["DATA PIPELINE", 457, 104], ["AUTOMATION", 430, 91], ["AI / FORECAST", 403, 105], ["WEB SERVICE", 376, 94], ["EMBEDDED", 349, 82]]) {
  first.pill(label, 28, y, width, C.navy2, C.white);
}

first.latin("EDUCATION", 28, 292, 8, C.lime, "F4");
first.line(28, 282, 150, 282, C.navy2);
first.text("홍익대학교(서울)", 28, 259, 9, C.white, "F2");
first.text("전자전기공학부 학사", 28, 242, 8, C.white);
first.latin("2018.03 - 2024.02", 28, 224, 7, C.cyan);
first.text("학점 3.50 / 4.50", 28, 207, 7, C.white);

first.latin("CERTIFICATIONS", 28, 158, 8, C.lime, "F4");
first.line(28, 148, 150, 148, C.navy2);
first.text("ADsP 데이터분석 준전문가", 28, 126, 7.5, C.white);
first.text("컴퓨터활용능력 1급", 28, 108, 7.5, C.white);
first.text("OPIc IH", 28, 90, 7.5, C.white);
first.latin("PORTFOLIO  /  01", 28, 28, 7, C.cyan, "F4");

first.latin("ENGINEER PROFILE", 211, 791, 8, C.violet, "F4");
first.text("공장 데이터를 모으고,", 211, 750, 25, C.ink, "F2");
first.text("자동화하고, 예측합니다.", 211, 716, 25, C.ink, "F2");
first.rect(211, 690, 44, 4, C.cyan);
first.text("빙그레 생산기술팀에서 5개 공장의 에너지·생산 데이터를 통합하고", 211, 655, 9, C.muted);
first.text("반복 업무를 자동화했습니다. 설비·제어 경험 위에 데이터 파이프라인과", 211, 636, 9, C.muted);
first.text("AI 도구를 연결해 실제 현장에서 작동하는 시스템을 만듭니다.", 211, 617, 9, C.muted);

first.latin("IMPACT AT A GLANCE", 211, 569, 8, C.violet, "F4");
first.number("5", "통합 공장", 211, 484, C.cyan);
first.number("1,000h", "임베디드 교육", 333, 484, C.violet);
first.number("3", "핵심 역량 축", 455, 484, C.lime);

first.latin("EXPERIENCE", 211, 442, 8, C.violet, "F4");
first.line(215, 406, 215, 303, C.line, 2);
first.circle(215, 405, 5, C.cyan);
first.latin("2024.12 - PRESENT", 234, 407, 7, C.cyan, "F4");
first.text("빙그레  |  생산담당 생산기술팀", 234, 382, 12, C.ink, "F2");
first.text("유틸리티·에너지 관리 / 생산부문 시스템 개선", 234, 359, 8.5, C.muted);
first.text("• 공장 에너지·생산 데이터 통합", 234, 329, 8.5, C.ink);
first.text("• 반복 수집·검토 업무 자동화", 234, 309, 8.5, C.ink);

first.latin("WORKING PRINCIPLE", 211, 260, 8, C.violet, "F4");
first.rect(211, 151, 356, 87, C.cyanSoft);
first.text("현장을 이해하고", 230, 210, 10, C.ink, "F2");
first.text("→ 데이터를 연결하고", 230, 187, 10, C.ink, "F2");
first.text("→ 반복 가능한 시스템으로 만듭니다.", 230, 164, 10, C.ink, "F2");
first.latin("kjw413.github.io/career-portfolio-web", 211, 91, 8, C.muted);
first.latin("UPDATED 2026.09.27", 444, 28, 7, C.muted, "F4");

const second = page();
second.rect(0, 0, 595, 842, C.paper);
second.rect(0, 770, 595, 72, C.navy);
second.latin("SELECTED WORK", 38, 800, 9, C.cyan, "F4");
second.text("문제에서 시스템까지", 38, 780, 15, C.white, "F2");
second.latin("PROJECT CASES  /  02", 430, 793, 8, C.lime, "F4");

const projectCard = ({ x, y, width, height, index, type, title, lines, tags, accent, dark = false }) => {
  second.rect(x, y, width, height, dark ? C.navy : C.white);
  second.rect(x, y + height - 5, width, 5, accent);
  second.latin(index, x + 18, y + height - 31, 9, accent, "F4");
  second.latin(type, x + 49, y + height - 30, 7, dark ? C.cyan : C.violet, "F4");
  second.text(title, x + 18, y + height - 62, 14, dark ? C.white : C.ink, "F2");
  lines.forEach((item, lineIndex) => second.text(item, x + 18, y + height - 87 - lineIndex * 17, 8, dark ? C.white : C.muted));
  let tagX = x + 18;
  for (const tag of tags) {
    const tagWidth = 13 + tag.length * 4.4;
    second.pill(tag, tagX, y + 17, tagWidth, dark ? C.navy2 : C.paper, dark ? C.white : C.ink);
    tagX += tagWidth + 6;
  }
};

projectCard({ x: 38, y: 552, width: 519, height: 183, index: "01", type: "AI ORCHESTRATION", title: "My Agent Switchboard", lines: ["여러 AI 에이전트의 역할과 현재 작업을 구분하고, 필요한 시점에", "작업 주체를 전환·조율하기 위한 멀티 에이전트 오케스트레이션 도구.", "github.com/kjw413/my-agent-switchboard"], tags: ["MULTI-AGENT", "ORCHESTRATION", "AI TOOLING"], accent: C.lime, dark: true });
projectCard({ x: 38, y: 342, width: 252, height: 180, index: "02", type: "DATA · AI · WEB", title: "공장 에너지 AI 플랫폼", lines: ["5개 공장의 에너지·생산 데이터와", "AI 예측·실측을 한 화면에 통합.", "수집부터 진단·보고까지 연결."], tags: ["5 PLANTS", "FORECAST"], accent: C.cyan });
projectCard({ x: 305, y: 342, width: 252, height: 180, index: "03", type: "MANUFACTURING · RPA", title: "MIS 데이터 수집 자동화", lines: ["공장별 MIS 조회와 전사 과정을", "검증 가능한 파이프라인으로 자동화.", "표준 데이터셋을 반복 생성."], tags: ["RPA", "PIPELINE"], accent: C.violet });
projectCard({ x: 38, y: 132, width: 252, height: 180, index: "04", type: "AUTOMATION", title: "Universal RPA Studio", lines: ["반복적인 화면 작업을 자동화하는", "제조·업무 자동화 프로젝트.", "재사용 가능한 실행 흐름을 지향."], tags: ["AUTOMATION", "TOOL"], accent: C.lime });
projectCard({ x: 305, y: 132, width: 252, height: 180, index: "05", type: "EMBEDDED · VISION", title: "페달 오조작 감지 시스템", lines: ["YOLOv5 인지 결과를 UART 통신과", "임베디드 제어까지 연결해", "인지 → 통신 → 제어 동작 확인."], tags: ["YOLOV5", "UART"], accent: C.cyan });
second.latin("FULL CASE STUDIES", 38, 78, 7, C.violet, "F4");
second.latin("kjw413.github.io/career-portfolio-web/", 38, 56, 9, C.ink, "F4");
second.text("데이터 파이프라인 · 업무 자동화 · 에너지 예측 · 웹 서비스 · 임베디드 제어", 305, 57, 7.5, C.muted);
second.latin("JONG WOO KIM", 463, 24, 7, C.muted, "F4");

const objects = [];
const add = (body) => (objects.push(body), objects.length);
const catalogId = add("");
const pagesId = add("");
const regularFontId = add("<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [4 0 R] >>");
add("<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>");
const boldFontId = add("<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [6 0 R] >>");
add("<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>");
const latinFontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const latinBoldFontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

const pageIds = [];
for (const item of [first, second]) {
  const stream = `${item.commands.join("\n")}\n`;
  const contentId = add(`<< /Length ${Buffer.byteLength(stream, "binary")} >>\nstream\n${stream}endstream`);
  const resources = `/Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R /F3 ${latinFontId} 0 R /F4 ${latinBoldFontId} 0 R >>`;
  pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << ${resources} >> /Contents ${contentId} 0 R >>`));
}

objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
const offsets = [0];
objects.forEach((body, index) => {
  offsets.push(Buffer.byteLength(pdf, "binary"));
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf, "binary");
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

fs.writeFileSync(output, Buffer.from(pdf, "binary"));
console.log(`Generated ${path.relative(process.cwd(), output)} (${pageIds.length} designed pages)`);
