import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 채용담당자가 실제로 화면에서 읽는 것을 지키는 테스트입니다.
 * 1. 추상적·수사적 문구가 다시 들어오지 않을 것
 * 2. 육안으로 읽기 어려운 글자 크기를 쓰지 않을 것
 */

function read(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const COPY_SOURCES = [
  "app/page.tsx",
  "app/archive.tsx",
  "app/components/Hero.tsx",
  "app/components/ImpactGrid.tsx",
  "content/profile.json",
  "content/experience.json",
];

/** 한 번 걷어낸 수사적 표현. 다시 들어오면 실패합니다. */
const BANNED_PHRASES = [
  "오간 경험",
  "경계를 연결",
  "경계를 오간",
  "문제를 성과로",
  "기술을 결과로",
  "새로운 문제를 기다립니다",
  "기술과 현장 사이",
  "지속적인 학습",
  "공학적 기반",
  "의사결정 가능한",
  "번역합니다",
];

describe("사이트 문구", () => {
  it("추상적인 수사 대신 사실을 적는다", () => {
    for (const source of COPY_SOURCES) {
      const text = read(source);
      for (const phrase of BANNED_PHRASES) {
        expect(`${source}: ${text.includes(phrase) ? phrase : ""}`).toBe(`${source}: `);
      }
    }
  });
});

describe("글자 크기", () => {
  const css = read("app/globals.css");

  it("본문 글꼴 스택의 첫 항목이 한글 글꼴이다", () => {
    // Arial이 앞에 오면 한글만 대체 글꼴로 떨어져 자소 크기와 선 굵기가 어긋납니다.
    const fontFamily = /body\s*\{[^}]*font-family:\s*([^;]+);/s.exec(css)?.[1] ?? "";
    expect(fontFamily.trimStart().startsWith('"Pretendard"')).toBe(true);
    expect(/^\s*Arial/.test(fontFamily)).toBe(false);
  });

  it("12px보다 작은 글자를 쓰지 않는다", () => {
    const tooSmall = [...css.matchAll(/font(?:-size)?:\s*[^;]*?(\d+(?:\.\d+)?)px/g)]
      .map((match) => Number(match[1]))
      .filter((size) => size < 11.5);

    expect(tooSmall).toEqual([]);
  });

  it("작은 라벨을 Courier로 떨어지는 monospace로 렌더링하지 않는다", () => {
    // 코드·저장소명 표기에만 monospace를 남깁니다.
    const monospaceRules = [...css.matchAll(/^([^{@\n][^{]*)\{[^}]*monospace[^}]*\}/gm)]
      .map((match) => match[1].trim());

    expect(monospaceRules).toEqual([
      ".detail-repo",
      ".markdown-body code",
      ".markdown-body pre",
    ]);
  });
});
