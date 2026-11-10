/**
 * 포트폴리오 구성 — 어떤 경험을, 어떤 상세도로, 어떤 순서로 싣는지 — 를 다루는 순수 함수입니다.
 * 파일을 읽지 않으므로 빌더 화면(브라우저)과 테스트가 그대로 함께 씁니다.
 *
 * 구성은 URL에만 담습니다. 회사별 구성을 저장소에 두면 지원 대상이 공개되기 때문입니다
 * (content/applications/README.md와 같은 이유).
 */

export type Level = "summary" | "detail";
export type SelectionItem = { id: string; level: Level };

/** 문서에서 켜고 끌 수 있는 섹션. 경험 목록은 항목 선택으로 정하므로 여기에 없습니다. */
export const SECTION_KEYS = ["summary", "metrics", "history", "qualifications", "skills"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type Selection = {
  /** selection-guide.json의 직무군. 프리셋과 경고의 기준입니다. */
  job: string | null;
  /** 문서에 싣는 순서 그대로입니다. */
  items: SelectionItem[];
  /** 끈 섹션 */
  hidden: SectionKey[];
  /** 문서 속 사이트 링크에 붙일 추적 코드(?ref=). 비어 있으면 붙이지 않습니다. */
  ref: string;
  /** 재직기간을 계산하는 기준일(YYYY-MM-DD). null이면 문서를 만드는 날입니다. */
  asOf: string | null;
};

export type JobGuide = {
  job: string;
  primary: string[];
  secondary: string[];
  exclude: string[];
  excludeReason: string;
};

/** 경고를 내는 데 필요한 만큼만 받습니다. */
export type SelectableModule = {
  id: string;
  title: string;
  /** 원장의 확인 상태. 프로젝트 사례에는 없습니다. */
  status: string | null;
  /** 이 경험을 쓰지 않기로 한 직무군 */
  excludeFor: string[];
};

export type SelectionWarning = {
  id: string;
  kind: "excluded" | "unsettled";
  message: string;
};

const LEVEL_CODE: Record<Level, string> = { summary: "s", detail: "d" };
const REF_PATTERN = /^[A-Za-z0-9_-]{1,24}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 직무군 프리셋: 1순위 경험은 상세로, 보조 경험은 요약으로 싣습니다. */
export function presetForJob(
  guide: JobGuide,
  available: ReadonlySet<string>,
): { items: SelectionItem[]; unavailable: string[] } {
  const items: SelectionItem[] = [];
  const unavailable: string[] = [];
  const add = (id: string, level: Level) => {
    if (!available.has(id)) unavailable.push(id);
    else if (!items.some((item) => item.id === id)) items.push({ id, level });
  };
  for (const id of guide.primary) add(id, "detail");
  for (const id of guide.secondary) add(id, "summary");
  return { items, unavailable };
}

export function levelOf(items: SelectionItem[], id: string): Level | null {
  return items.find((item) => item.id === id)?.level ?? null;
}

/** 상세도를 바꿉니다. null이면 뺍니다. 이미 있는 항목은 자리를 지키고, 새 항목은 끝에 붙습니다. */
export function setLevel(items: SelectionItem[], id: string, level: Level | null): SelectionItem[] {
  if (level === null) return items.filter((item) => item.id !== id);
  if (items.some((item) => item.id === id)) {
    return items.map((item) => (item.id === id ? { id, level } : item));
  }
  return [...items, { id, level }];
}

/** 한 칸 위(-1)나 아래(+1)로 옮깁니다. 끝에서는 그대로입니다. */
export function moveItem(items: SelectionItem[], id: string, delta: -1 | 1): SelectionItem[] {
  const from = items.findIndex((item) => item.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function encodeSelection(selection: Selection): string {
  const params = new URLSearchParams();
  if (selection.job) params.set("job", selection.job);
  // 비어 있어도 적습니다. 없으면 "기본 구성"으로 읽기 때문입니다.
  params.set("m", selection.items.map((item) => `${item.id}.${LEVEL_CODE[item.level]}`).join(","));
  if (selection.hidden.length > 0) params.set("hide", selection.hidden.join(","));
  if (selection.ref) params.set("ref", selection.ref);
  if (selection.asOf) params.set("date", selection.asOf);
  return params.toString();
}

/**
 * URL의 구성을 읽습니다. 모르는 항목·직무군·형식은 조용히 버립니다 —
 * 카드가 원장에서 빠진 뒤에도 예전에 저장해 둔 링크가 깨지지 않게 하기 위해서입니다.
 *
 * `m`이 없으면: 직무군이 있으면 그 프리셋, 없으면 기본 구성(fallback)입니다.
 */
export function decodeSelection(
  search: string,
  context: { available: ReadonlySet<string>; guides: JobGuide[]; fallback: SelectionItem[] },
): Selection {
  const params = new URLSearchParams(search);
  const guide = context.guides.find((item) => item.job === params.get("job")) ?? null;

  let items: SelectionItem[];
  const encoded = params.get("m");
  if (encoded === null) {
    items = guide ? presetForJob(guide, context.available).items : context.fallback;
  } else {
    items = [];
    for (const part of encoded.split(",")) {
      const dot = part.lastIndexOf(".");
      const id = dot < 0 ? part : part.slice(0, dot);
      const level: Level = dot >= 0 && part.slice(dot + 1) === "d" ? "detail" : "summary";
      if (context.available.has(id) && !items.some((item) => item.id === id)) {
        items.push({ id, level });
      }
    }
  }
  items = items.filter((item) => context.available.has(item.id));

  const hidden = (params.get("hide") ?? "")
    .split(",")
    .filter((key): key is SectionKey => (SECTION_KEYS as readonly string[]).includes(key));
  const ref = params.get("ref") ?? "";
  const date = params.get("date") ?? "";

  return {
    job: guide?.job ?? null,
    items,
    hidden: [...new Set(hidden)],
    ref: REF_PATTERN.test(ref) ? ref : "",
    asOf: DATE_PATTERN.test(date) && !Number.isNaN(Date.parse(date)) ? date : null,
  };
}

/** 추적 코드로 쓸 수 있는 글자만 남깁니다. */
export function sanitizeRef(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
}

/** 사이트 링크에 추적 코드를 붙입니다. 방문 통계의 유입 경로에 이 코드가 잡힙니다. */
export function withRef(url: string, ref: string): string {
  if (!REF_PATTERN.test(ref)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}ref=${ref}`;
}

/**
 * 제출 전에 다시 볼 항목. 막지는 않고 알리기만 합니다 — 무엇을 낼지는 사람이 정합니다.
 *   - 고른 직무군에서 쓰지 않기로 한 경험 (selection-guide의 exclude, 카드의 excludeFor)
 *   - 일부 사실이 아직 확정되지 않은 경험 (원장의 부분확정)
 */
export function selectionWarnings(
  selection: Selection,
  modules: SelectableModule[],
  guide: JobGuide | null,
): SelectionWarning[] {
  const byId = new Map(modules.map((entry) => [entry.id, entry]));
  const warnings: SelectionWarning[] = [];

  for (const item of selection.items) {
    const entry = byId.get(item.id);
    if (!entry) continue;

    if (guide && (guide.exclude.includes(item.id) || entry.excludeFor.includes(guide.job))) {
      const reason =
        guide.exclude.includes(item.id) && guide.excludeReason ? ` (${guide.excludeReason})` : "";
      warnings.push({
        id: item.id,
        kind: "excluded",
        message: `${entry.title}: '${guide.job}' 직무에서는 기본 제외로 정한 경험입니다${reason}`,
      });
    }
    if (entry.status === "부분확정") {
      warnings.push({
        id: item.id,
        kind: "unsettled",
        message: `${entry.title}: 일부 사실이 아직 확정 전입니다. 제출 전에 경험 카드의 확인 필요 항목을 보세요`,
      });
    }
  }
  return warnings;
}
