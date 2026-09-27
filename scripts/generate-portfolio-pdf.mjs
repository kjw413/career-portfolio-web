import fs from "node:fs";
import path from "node:path";

const output = path.join(process.cwd(), "public", "portfolio.pdf");

const pages = [
  [
    { size: 25, y: 790, text: "김종우 | 커리어 포트폴리오" },
    { size: 12, y: 763, text: "공장 데이터를 모으고, 자동화하고, 예측하는 엔지니어" },
    { size: 9, y: 741, text: "GitHub  github.com/kjw413   |   Email  kjw2110@naver.com" },
    { size: 15, y: 700, text: "PROFILE" },
    { size: 10, y: 678, text: "빙그레 생산기술팀에서 5개 공장의 에너지·생산 데이터를 통합하고," },
    { size: 10, y: 660, text: "매일 반복되던 수집과 검토 업무를 자동화했습니다. 전자전기공학 전공과" },
    { size: 10, y: 642, text: "1,000시간 임베디드 교육을 바탕으로 설비·제어와 AI 도구를 함께 다룹니다." },
    { size: 15, y: 600, text: "KEY IMPACT" },
    { size: 11, y: 575, text: "01  MIS 데이터 수집 자동화" },
    { size: 9, y: 555, text: "5개 공장 화면 수집·검증·표준 데이터셋 생성을 하나의 파이프라인으로 구성" },
    { size: 11, y: 520, text: "02  공장 에너지 데이터 통합" },
    { size: 9, y: 500, text: "전력·연료·용수와 생산 실적의 수집·저장·예측·진단·보고를 웹 서비스로 연결" },
    { size: 11, y: 465, text: "03  카메라 인지 결과를 임베디드 제어까지 연결" },
    { size: 9, y: 445, text: "YOLOv5 적색 신호 인지와 UART 기반 통신 경로를 구현해 실제 동작을 확인" },
    { size: 15, y: 400, text: "EXPERIENCE" },
    { size: 11, y: 375, text: "빙그레 | 생산담당 생산기술팀 사원 | 2024.12–현재" },
    { size: 9, y: 355, text: "유틸리티·에너지 관리, 생산부문 시스템 개선" },
    { size: 15, y: 310, text: "EDUCATION & CERTIFICATIONS" },
    { size: 10, y: 285, text: "홍익대학교(서울) 전자전기공학부 학사 | 2018.03–2024.02 | 3.50/4.50" },
    { size: 10, y: 263, text: "ADsP 데이터분석 준전문가 · 컴퓨터활용능력 1급 · OPIc IH" },
  ],
  [
    { size: 22, y: 790, text: "SELECTED PROJECTS" },
    { size: 14, y: 748, text: "My Agent Switchboard" },
    { size: 9, y: 727, text: "MULTI-AGENT · ORCHESTRATION · AI TOOLING" },
    { size: 10, y: 705, text: "여러 AI 에이전트의 역할과 현재 작업을 구분하고, 필요한 시점에 작업 주체를" },
    { size: 10, y: 687, text: "전환·조율하기 위한 멀티 에이전트 오케스트레이션 도구입니다." },
    { size: 9, y: 665, text: "github.com/kjw413/my-agent-switchboard" },
    { size: 14, y: 615, text: "공장 에너지 AI 플랫폼" },
    { size: 10, y: 592, text: "5개 공장의 에너지·생산 데이터를 통합하고 AI 예측과 실측을 함께 제공하는" },
    { size: 10, y: 574, text: "사내 웹 서비스. 수집부터 진단과 보고까지 하나의 흐름으로 연결했습니다." },
    { size: 14, y: 525, text: "Universal RPA Studio" },
    { size: 10, y: 502, text: "반복적인 화면 작업을 자동화할 수 있도록 구성한 제조·업무 자동화 프로젝트입니다." },
    { size: 14, y: 453, text: "MIS 데이터 수집 자동화" },
    { size: 10, y: 430, text: "공장별 MIS 조회와 전사 과정을 자동화하고 검증 가능한 표준 데이터셋을 만듭니다." },
    { size: 14, y: 381, text: "페달 오조작 감지 보조 시스템" },
    { size: 10, y: 358, text: "영상 인지 결과를 보드 통신과 제어까지 연결한 임베디드 교육 프로젝트입니다." },
    { size: 15, y: 300, text: "CAPABILITIES" },
    { size: 10, y: 275, text: "데이터 파이프라인 · 업무 자동화 · 에너지 예측 · 웹 서비스 · 임베디드 제어" },
    { size: 9, y: 218, text: "상세 수행 과정과 최신 프로젝트는 웹 포트폴리오에서 확인할 수 있습니다." },
    { size: 10, y: 195, text: "kjw413.github.io/career-portfolio-web/" },
    { size: 8, y: 60, text: "Updated 2026.09.27" },
  ],
];

const utf16Hex = (text) => {
  const bytes = Buffer.from(`\ufeff${text}`, "utf16le");
  for (let index = 0; index < bytes.length; index += 2) {
    [bytes[index], bytes[index + 1]] = [bytes[index + 1], bytes[index]];
  }
  return bytes.toString("hex").toUpperCase();
};

const objects = [];
const add = (body) => (objects.push(body), objects.length);
const catalogId = add("");
const pagesId = add("");
const fontId = add("<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [4 0 R] >>");
add("<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>");

const pageIds = [];
for (const lines of pages) {
  const commands = ["0.09 0.12 0.16 rg", "BT"];
  for (const line of lines) {
    commands.push(`/F1 ${line.size} Tf`, `1 0 0 1 52 ${line.y} Tm`, `<${utf16Hex(line.text)}> Tj`);
  }
  commands.push("ET");
  const stream = `${commands.join("\n")}\n`;
  const contentId = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
  pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`));
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
console.log(`Generated ${path.relative(process.cwd(), output)} (${pages.length} pages)`);
