import { describe, expect, it } from "vitest";
import { completedMonths, formatCareerPeriod, formatMonths, formatYearMonth } from "./tenure";

describe("tenure", () => {
  it("counts only months that have fully elapsed", () => {
    expect(completedMonths("2024-12-23", new Date("2026-08-17T00:00:00"))).toBe(19);
    expect(completedMonths("2024-12-23", new Date("2026-08-23T00:00:00"))).toBe(20);
    expect(completedMonths("2024-12-23", new Date("2024-12-01T00:00:00"))).toBe(0);
  });

  it("formats durations without empty units", () => {
    expect(formatMonths(19)).toBe("1년 7개월");
    expect(formatMonths(24)).toBe("2년");
    expect(formatMonths(7)).toBe("7개월");
  });

  it("formats year-month labels with a leading zero", () => {
    expect(formatYearMonth("2024-12-23")).toBe("2024.12");
    expect(formatYearMonth("2024-02")).toBe("2024.02");
  });

  it("marks an open-ended career as still employed", () => {
    expect(
      formatCareerPeriod({ startDate: "2024-12-23", endDate: null }, new Date("2026-08-17T00:00:00")),
    ).toBe("2024.12 ~ 재직 중 · 1년 7개월");
  });

  it("uses the end date instead of today once a career is over", () => {
    expect(
      formatCareerPeriod(
        { startDate: "2024-01-29", endDate: "2024-02-27" },
        new Date("2026-08-17T00:00:00"),
      ),
    ).toBe("2024.01 ~ 2024.02 · 0개월");
  });

  it("rejects a start date that is not an ISO calendar date", () => {
    expect(() => completedMonths("2024/12/23", new Date())).toThrow(/YYYY-MM/);
  });
});
