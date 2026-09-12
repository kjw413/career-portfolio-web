import { describe, expect, it } from "vitest";
import {
  metricTokensIn,
  readApplications,
  readLedger,
  readProjectSlugs,
  resolveMetricTokens,
  validateApplications,
  validateLedger,
} from "./ledger-core.mjs";
import { getExperiences, getMetric, getPublicCards, fillMetrics } from "./ledger";

/** 실제 원장을 조금씩 망가뜨려, 검증기가 그걸 잡는지 확인합니다. */
function brokenLedger(mutate: (ledger: ReturnType<typeof readLedger>) => void) {
  const ledger = JSON.parse(JSON.stringify(readLedger())) as ReturnType<typeof readLedger>;
  mutate(ledger);
  return validateLedger(ledger, { projectSlugs: readProjectSlugs() });
}

/** 변형이 서로 덮어쓰지 않도록 카드를 id로 집습니다. */
function card(ledger: ReturnType<typeof readLedger>, id: string) {
  const found = ledger.cards.find((item: { id: string }) => item.id === id);
  if (!found) throw new Error(`테스트가 없는 카드를 집었습니다: ${id}`);
  return found;
}

describe("원장 검증", () => {
  it("지금의 원장은 오류가 없다", () => {
    expect(validateLedger(readLedger(), { projectSlugs: readProjectSlugs() })).toEqual([]);
  });

  it("존재하지 않는 수치를 인용하면 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      card(ledger, "EXP-BG-ENERGY-WEB").headline = "결과는 {{metric:made-up-number}}입니다";
    });
    expect(errors.join("\n")).toContain("made-up-number");
  });

  it("본문에서 인용한 수치가 metricIds에 없으면 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      card(ledger, "EXP-BG-INVEST-RPA").body += "\n\n전사 평균은 {{metric:forecast-mape-all}}입니다.";
    });
    expect(errors.join("\n")).toContain("metricIds에 없습니다");
  });

  it("확정되지 않은 수치를 공개 카드에서 인용하면 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      card(ledger, "EXP-INBODY-CLAIM").headline = "역전이 {{metric:inbody-reversal-count}} 있었습니다";
    });
    expect(errors.join("\n")).toContain("확정되지 않은 수치");
  });

  it("미확정 카드를 사이트에 노출하면 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      const sampling = card(ledger, "EXP-BG-SAMPLING-RPA");
      sampling.publicOnSite = true;
      sampling.highlights = ["확인되지 않은 내용"];
    });
    expect(errors.join("\n")).toContain("미확정 카드는 사이트에 노출하지 않습니다");
  });

  it("끊어진 참조를 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      const target = card(ledger, "EXP-UNIV-MCU");
      target.relatedCards = ["EXP-DOES-NOT-EXIST"];
      target.projectSlugs = ["없는-프로젝트"];
      target.openQuestions = ["OQ-NOPE"];
    });
    expect(errors.join("\n")).toContain("EXP-DOES-NOT-EXIST");
    expect(errors.join("\n")).toContain("없는-프로젝트");
    expect(errors.join("\n")).toContain("OQ-NOPE");
  });

  it("날짜 형식과 순서를 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      card(ledger, "EXP-BG-ENERGY-WEB").period = { start: "2026/03/01", end: null, asOf: "2026-09-12" };
      card(ledger, "EXP-BG-DATA-RPA").period = { start: "2026-05-07", end: "2026-04-01", asOf: "2026-09-12" };
    });
    expect(errors.join("\n")).toContain("YYYY-MM 또는 YYYY-MM-DD");
    expect(errors.join("\n")).toContain("period.end보다 늦습니다");
  });

  it("저장소에 들어오면 안 되는 개인정보를 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      card(ledger, "EXP-UNIV-POWERFLOW").body += "\n\n연락처는 010-1234-5678입니다.";
    });
    expect(errors.join("\n")).toContain("휴대전화번호");
  });

  it("소속이 자기 카드를 빠뜨리면 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      const binggrae = ledger.affiliations.find((item) => item.id === "binggrae");
      binggrae.cardIds = binggrae.cardIds.filter((id: string) => id !== "EXP-BG-DATA-RPA");
    });
    expect(errors.join("\n")).toContain("EXP-BG-DATA-RPA가 cardIds에 없습니다");
  });

  it("같은 직무에서 쓰면서 동시에 제외하는 카드를 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      ledger.selectionGuide[0].exclude.push(ledger.selectionGuide[0].primary[0]);
    });
    expect(errors.join("\n")).toContain("사용 대상이면서 제외 대상입니다");
  });

  it("공개 카드에 훑어볼 항목이 없으면 잡는다", () => {
    const errors = brokenLedger((ledger) => {
      card(ledger, "EXP-BG-ENERGY-WEB").highlights = [];
    });
    expect(errors.join("\n")).toContain("highlights는 1~4개");
  });
});

describe("수치 인용", () => {
  it("토큰을 레지스트리 값으로 채운다", () => {
    const metrics = { "a-b": { display: "7.3%", label: "예측 오차" } };
    expect(resolveMetricTokens("평균 {{metric:a-b}}", metrics)).toBe("평균 7.3%");
    expect(resolveMetricTokens("{{metric:a-b|label}}", metrics)).toBe("예측 오차");
  });

  it("없는 수치나 없는 필드를 인용하면 던진다", () => {
    const metrics = { "a-b": { display: "7.3%" } };
    expect(() => resolveMetricTokens("{{metric:nope}}", metrics)).toThrow();
    expect(() => resolveMetricTokens("{{metric:a-b|unit}}", metrics)).toThrow();
  });

  it("본문에서 인용한 토큰을 모두 찾는다", () => {
    expect(metricTokensIn("{{metric:x}}와 {{metric:y|label}}").map((token) => token.id)).toEqual([
      "x",
      "y",
    ]);
  });
});

describe("화면용 파생", () => {
  it("확정값을 한 곳에서 고치면 모든 인용이 따라온다", () => {
    const forecast = getMetric("forecast-mape-all");

    expect(forecast.display).toBe("MAPE 7.3%");
    expect(fillMetrics("평균 {{metric:forecast-mape-all}}")).toBe("평균 MAPE 7.3%");
    expect(getExperiences().flatMap((item) => item.details).join(" ")).toContain(forecast.display);
  });

  it("사이트에는 확정되지 않은 카드를 내보내지 않는다", () => {
    const published = getPublicCards().map((card) => card.id);

    expect(published).not.toContain("EXP-BG-SAMPLING-RPA");
    expect(published).not.toContain("EXP-MIL-LEADERSHIP");
    expect(published).toContain("EXP-BG-ENERGY-FORECAST");
  });

  it("소속 기간을 시작·종료일에서 만든다", () => {
    const byId = new Map(getExperiences().map((item) => [item.id, item]));

    expect(byId.get("binggrae")?.period).toBe("2024.12 ~ 재직 중");
    expect(byId.get("ai-elite")?.period).toBe("2026.02 ~ 2026.05 수료");
    expect(byId.get("telechips-school")?.period).toBe("2024.06 ~ 2024.12");
  });
});

describe("제출 이력", () => {
  const ledger = readLedger();
  const applications = readApplications();

  it("지금의 제출 이력은 원장과 어긋나지 않는다", () => {
    expect(validateApplications(applications, ledger)).toEqual([]);
  });

  it("직무에서 기본 제외한 카드를 썼으면 잡는다", () => {
    const broken = JSON.parse(JSON.stringify(applications));
    broken[0].jobFamily = "제조 AI·데이터";
    broken[0].questions[0].cardIds = ["EXP-CLUB-BUDGET"];

    expect(validateApplications(broken, ledger).join("\n")).toContain("기본 제외 카드");
  });

  it("본문을 확인했다고 하면서 사용 카드를 비워 두면 잡는다", () => {
    const broken = JSON.parse(JSON.stringify(applications));
    broken[0].questions = [];

    expect(validateApplications(broken, ledger).join("\n")).toContain("사용 카드를 적습니다");
  });

  it("공개 저장소에 회사 정보를 넣지 않는다", () => {
    const text = JSON.stringify(applications);
    for (const company of ["빙그레", "하이닉스", "현대", "LG", "기아", "한화", "KT&G"]) {
      expect(text).not.toContain(company);
    }
  });

  it("이미 제출한 지원서의 표현 문제를 기록으로 남긴다", () => {
    const failed = applications.filter((item: { lint: { status: string } }) => item.lint.status === "fail");

    expect(failed.length).toBeGreaterThan(0);
    expect(failed[0].lint.notes.join(" ")).toContain("금지 표현");
  });
});
