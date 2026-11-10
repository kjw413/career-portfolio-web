import { describe, expect, it } from "vitest";
import {
  decodeSelection,
  encodeSelection,
  moveItem,
  presetForJob,
  selectionWarnings,
  setLevel,
  withRef,
  type JobGuide,
  type Selection,
} from "./portfolio-selection";

/**
 * 회사별 구성은 저장소가 아니라 링크에만 남습니다. 그래서 링크가 구성을 온전히 되살려야 하고,
 * 원장에서 카드가 빠진 뒤에도 예전에 저장해 둔 링크가 깨지면 안 됩니다.
 */

const guide: JobGuide = {
  job: "제조 AI·데이터",
  primary: ["EXP-A", "EXP-B"],
  secondary: ["EXP-C", "EXP-HIDDEN"],
  exclude: ["EXP-X"],
  excludeReason: "관련성 낮은 일반 활동은 제외",
};
const available = new Set(["EXP-A", "EXP-B", "EXP-C", "EXP-X", "EXP-Y", "side-project"]);
const context = { available, guides: [guide], fallback: [{ id: "EXP-Y", level: "detail" as const }] };

describe("직무군 프리셋", () => {
  it("1순위는 상세로, 보조는 요약으로 싣고 제외 카드는 넣지 않는다", () => {
    const { items } = presetForJob(guide, available);
    expect(items).toEqual([
      { id: "EXP-A", level: "detail" },
      { id: "EXP-B", level: "detail" },
      { id: "EXP-C", level: "summary" },
    ]);
  });

  it("사이트에 공개하지 않은 카드는 싣지 않고 따로 알린다", () => {
    expect(presetForJob(guide, available).unavailable).toEqual(["EXP-HIDDEN"]);
  });
});

describe("구성을 링크에 담기", () => {
  const selection: Selection = {
    job: "제조 AI·데이터",
    items: [
      { id: "EXP-B", level: "detail" },
      { id: "side-project", level: "summary" },
    ],
    hidden: ["skills"],
    ref: "a07",
    asOf: "2026-11-10",
  };

  it("링크에서 같은 구성이 순서까지 그대로 살아난다", () => {
    expect(decodeSelection(encodeSelection(selection), context)).toEqual(selection);
  });

  it("아무것도 고르지 않은 구성도 기본 구성으로 되돌아가지 않는다", () => {
    const empty = { ...selection, items: [] };
    expect(decodeSelection(encodeSelection(empty), context).items).toEqual([]);
  });

  it("구성이 없는 주소는 기본 구성을, 직무군만 있는 주소는 그 프리셋을 연다", () => {
    expect(decodeSelection("", context).items).toEqual(context.fallback);
    expect(decodeSelection("job=제조 AI·데이터", context).items).toEqual(
      presetForJob(guide, available).items,
    );
  });

  it("원장에서 빠진 카드와 잘못된 값은 버리고 나머지는 살린다", () => {
    const decoded = decodeSelection(
      "job=없는직무&m=EXP-GONE.d,EXP-A.d,EXP-A.s,EXP-C&hide=skills,nope&ref=a b&date=2026-13-99",
      context,
    );
    expect(decoded).toEqual({
      job: null,
      items: [
        { id: "EXP-A", level: "detail" },
        { id: "EXP-C", level: "summary" },
      ],
      hidden: ["skills"],
      ref: "",
      asOf: null,
    });
  });
});

describe("항목 고르기", () => {
  const items = [
    { id: "EXP-A", level: "detail" as const },
    { id: "EXP-B", level: "summary" as const },
  ];

  it("상세도를 바꿔도 순서는 그대로이고, 새 항목은 끝에 붙는다", () => {
    expect(setLevel(items, "EXP-A", "summary").map((item) => item.id)).toEqual(["EXP-A", "EXP-B"]);
    expect(setLevel(items, "EXP-C", "detail")).toEqual([...items, { id: "EXP-C", level: "detail" }]);
    expect(setLevel(items, "EXP-A", null)).toEqual([{ id: "EXP-B", level: "summary" }]);
  });

  it("순서를 한 칸씩 옮기고, 끝에서는 그대로 둔다", () => {
    expect(moveItem(items, "EXP-B", -1).map((item) => item.id)).toEqual(["EXP-B", "EXP-A"]);
    expect(moveItem(items, "EXP-A", -1)).toBe(items);
    expect(moveItem(items, "EXP-B", 1)).toBe(items);
  });
});

describe("제출 전 경고", () => {
  const modules = [
    { id: "EXP-A", title: "예측모델", status: "확정", excludeFor: [] },
    { id: "EXP-X", title: "동아리 예산", status: "확정", excludeFor: [] },
    { id: "EXP-Y", title: "시계열 분석", status: "부분확정", excludeFor: ["제조 AI·데이터"] },
    { id: "side-project", title: "개인 프로젝트", status: null, excludeFor: [] },
  ];
  const selection: Selection = {
    job: guide.job,
    items: modules.map((entry) => ({ id: entry.id, level: "summary" as const })),
    hidden: [],
    ref: "",
    asOf: null,
  };

  it("직무에서 제외하기로 한 경험과 확정 전 경험을 알린다", () => {
    const warnings = selectionWarnings(selection, modules, guide);
    expect(warnings.map((warning) => [warning.id, warning.kind])).toEqual([
      ["EXP-X", "excluded"],
      ["EXP-Y", "excluded"],
      ["EXP-Y", "unsettled"],
    ]);
    expect(warnings[0].message).toContain("관련성 낮은 일반 활동은 제외");
  });

  it("직무군을 고르지 않으면 제외 경고는 내지 않는다", () => {
    const warnings = selectionWarnings({ ...selection, job: null }, modules, null);
    expect(warnings.map((warning) => warning.kind)).toEqual(["unsettled"]);
  });
});

describe("추적 코드", () => {
  it("코드가 있으면 사이트 링크에 붙이고, 없거나 잘못됐으면 붙이지 않는다", () => {
    expect(withRef("https://example.com/", "a07")).toBe("https://example.com/?ref=a07");
    expect(withRef("https://example.com/?x=1", "a07")).toBe("https://example.com/?x=1&ref=a07");
    expect(withRef("https://example.com/", "")).toBe("https://example.com/");
    expect(withRef("https://example.com/", "a b")).toBe("https://example.com/");
  });
});
