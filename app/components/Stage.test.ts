import { describe, expect, it } from "vitest";
import { stageValue } from "./Stage";

/**
 * 카메라 단계는 단계 글의 실제 위치로 정합니다. 첫 화면이 화면보다 길어도
 * 단계 글이 화면을 채우는 순간 카메라가 그 단계에 서야 합니다.
 */
describe("무대 단계 값", () => {
  const anchors = [0, 1100, 2000, 2900];

  it("첫 화면 맨 위는 0, 각 단계 글이 화면 맨 위에 닿으면 정수", () => {
    expect(stageValue(0, anchors, 900)).toBe(0);
    expect(stageValue(1100, anchors, 900)).toBe(1);
    expect(stageValue(2000, anchors, 900)).toBe(2);
    expect(stageValue(2900, anchors, 900)).toBe(3);
  });

  it("첫 화면이 화면보다 길면 그 길이에 맞춰 천천히 넘어간다", () => {
    expect(stageValue(550, anchors, 900)).toBeCloseTo(0.5);
  });

  it("마지막 단계 뒤로는 화면 높이 단위로 늘어나고, 음수가 되지 않는다", () => {
    expect(stageValue(3350, anchors, 900)).toBeCloseTo(3.5);
    expect(stageValue(-200, anchors, 900)).toBe(0);
  });
});
