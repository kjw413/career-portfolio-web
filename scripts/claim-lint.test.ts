import { describe, expect, it } from "vitest";
import { readLedger } from "../lib/ledger-core.mjs";
import { detectCards, lintCoverLetter } from "./claim-lint.mjs";

/**
 * 2026 하반기에 이미 제출한 지원서 한 건에서 금지 표현과 수치 불일치가 나왔습니다.
 * 검사기는 그 두 가지를 제출 전에 잡아야 합니다. 아래 초안은 그 상황을 재현합니다.
 */
const FAILING_DRAFT = `
빙그레 생산기술팀에서 5개 공장의 생산량과 에너지 데이터를 통합한 에너지 관리 시스템을 구축했습니다.
생산량 등 사내 데이터와 기상청 API로 추출한 기상 변수를 학습 데이터로 사용해 머신러닝 예측모델을 개발했습니다.
6개월 실적 기준, 전 공장 3가지 에너지원의 일 실적 예측 평균 오차 7%를 달성했고,
예측치를 활용해 이상 여부를 점검하는 수치 기반 관리 체계로 전환했습니다.
MIS 데이터 수집을 자동화해 월 15시간을 절감했습니다.
텔레칩스 임베디드 스쿨에서는 CAN 통신을 구현하고 신호등 인식 기능을 담당했습니다.
총 경력 1년 6개월 동안 현장의 문제를 데이터로 옮기는 일을 해 왔습니다.
`;

const CLEAN_DRAFT = `
빙그레 생산기술팀에서 5개 공장의 생산량과 에너지 데이터를 통합한 에너지 관리 웹 시스템을 구축했습니다.
담당자들의 월간 에너지 실적 보고용 취합 업무를 대체해 월 4시간을 절감했습니다.
에너지 사용량 예측모델도 개발해, 최근 6개월 기준 전 공장·전 에너지원 평균 MAPE 7.3%를 달성했습니다.
사용량 예측치는 실적과 함께 살펴보며 추가 확인을 위한 보조지표로 활용하고 있습니다.
`;

const options = { job: "제조 AI·데이터", submittedAt: "2026-09-12" };
const kinds = (result: ReturnType<typeof lintCoverLetter>) =>
  result.findings.filter((finding) => finding.level === "error").map((finding) => finding.kind);

describe("자기소개서 검사기", () => {
  it("조건이 다른 수치를 값만 보고 넘기지 않는다", () => {
    const result = lintCoverLetter(FAILING_DRAFT, options);
    const mismatch = result.findings.find((finding) => finding.kind === "수치 불일치");

    expect(mismatch?.quote).toBe("7%");
    expect(mismatch?.detail).toContain("forecast-mape-all");
    expect(mismatch?.detail).toContain("MAPE 7.3%");
  });

  it("전력 단독값으로 쓴 7%는 문제 삼지 않는다", () => {
    const result = lintCoverLetter(
      "5개 공장 평균으로 전력 예측 오차 약 7%를 달성했습니다.",
      options,
    );

    expect(result.findings.filter((finding) => finding.kind === "수치 불일치")).toEqual([]);
  });

  it("어미가 달라도 금지 표현을 잡는다", () => {
    const result = lintCoverLetter(FAILING_DRAFT, options);
    const forbidden = result.findings.filter((finding) => finding.kind === "금지 표현");

    // 원장에는 "…전환했다"로 적혀 있고 초안은 "…전환했습니다"입니다.
    expect(forbidden.some((finding) => finding.quote.includes("관리 체계로 전환"))).toBe(true);
    expect(forbidden.some((finding) => finding.quote.includes("CAN 통신을 구현"))).toBe(true);
  });

  it("폐기한 표기와 지원일 기준 재직기간을 잡는다", () => {
    const result = lintCoverLetter(FAILING_DRAFT, options);

    expect(kinds(result)).toContain("폐기된 표기");
    const tenure = result.findings.find((finding) => finding.kind === "재직기간 불일치");
    expect(tenure?.detail).toContain("1년 8개월");
  });

  it("확정되지 않은 수치를 쓰면 잡는다", () => {
    const result = lintCoverLetter(
      "인바디에서 체성분 분석기의 측정값 역전이 3회 발생한 것을 확인했습니다.",
      options,
    );

    expect(kinds(result)).toContain("확정 전 수치");
  });

  it("그 직무에서 빼기로 한 경험을 쓰면 알려 준다", () => {
    const result = lintCoverLetter(
      "교내 테니스 동아리 예산 개선을 맡아 학기별 예산계획을 문서화했습니다.",
      { job: "제조 AI·데이터", submittedAt: "2026-09-12" },
    );

    expect(result.findings.some((finding) => finding.kind === "제외 경험 사용")).toBe(true);
  });

  it("원장을 지킨 초안은 통과시킨다", () => {
    const result = lintCoverLetter(CLEAN_DRAFT, options);

    expect(result.status).toBe("pass");
    expect(result.findings.filter((finding) => finding.level === "error")).toEqual([]);
  });

  it("쓰지 않은 경험을 썼다고 추정하지 않는다", () => {
    const ledger = readLedger();
    const used = detectCards(CLEAN_DRAFT, ledger);

    expect(used).toContain("EXP-BG-ENERGY-WEB");
    expect(used).toContain("EXP-BG-ENERGY-FORECAST");
    expect(used).not.toContain("EXP-DATA-LAG3");
    expect(used).not.toContain("EXP-BG-SAMPLING-RPA");
  });

  it("원장이 스스로 적어 둔 내역 표기는 불일치로 보지 않는다", () => {
    // system-collab-count 는 "2건"이지만 조건이 "MIS 1건 + MES 1건"이고, 그렇게 나눠 쓰는 것이 권장 표기다.
    const result = lintCoverLetter(
      "현업 요구를 IT부서에 전달해 MIS 1건과 MES 1건을 반영했습니다.",
      options,
    );

    expect(result.findings.filter((finding) => finding.kind === "수치 불일치")).toEqual([]);
  });

  it("모르는 직무군을 조용히 넘기지 않는다", () => {
    const result = lintCoverLetter(CLEAN_DRAFT, { job: "없는직무", submittedAt: "2026-09-12" });

    expect(result.findings.some((finding) => finding.kind === "직무군 미상")).toBe(true);
  });
});
