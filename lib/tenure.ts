/**
 * 재직기간은 페이지에 고정 문구로 적어두면 시간이 지나면서 사실과 어긋납니다.
 * 입사일만 콘텐츠에 두고, 화면에 보이는 기간은 빌드 시점 기준으로 계산합니다.
 */

function parseDate(value: string, label: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) throw new Error(`${label} must be YYYY-MM or YYYY-MM-DD: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3] ?? "1") };
}

/** 시작일부터 기준일까지 지난 개월 수. 기준일이 시작일보다 이르면 0입니다. */
export function completedMonths(startDate: string, asOf: Date): number {
  const start = parseDate(startDate, "startDate");
  const months =
    (asOf.getFullYear() - start.year) * 12 + (asOf.getMonth() + 1 - start.month);
  return Math.max(asOf.getDate() < start.day ? months - 1 : months, 0);
}

/** 개월 수를 `1년 7개월` 형태로 표기합니다. */
export function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${remainder}개월`;
  if (remainder === 0) return `${years}년`;
  return `${years}년 ${remainder}개월`;
}

/** `2024-12-23` → `2024.12` */
export function formatYearMonth(date: string): string {
  const { year, month } = parseDate(date, "date");
  return `${year}.${String(month).padStart(2, "0")}`;
}

/** 재직 중이면 `2024.12 ~ 재직 중 · 1년 7개월`, 퇴사했으면 종료 연월을 씁니다. */
export function formatCareerPeriod(
  career: { startDate: string; endDate: string | null },
  asOf: Date,
): string {
  const start = formatYearMonth(career.startDate);
  const end = career.endDate;
  const until = end ? new Date(`${end.length === 7 ? `${end}-01` : end}T00:00:00`) : asOf;
  const duration = formatMonths(completedMonths(career.startDate, until));
  return `${start} ~ ${end ? formatYearMonth(end) : "재직 중"} · ${duration}`;
}
