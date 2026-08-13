import Papa from "papaparse";
import {
  AUDIENCES,
  RESOURCE_TYPES,
  SHEET_ID,
  TOPICS,
  YEAR_RANK,
  type AudienceKey,
  type LevelKey,
  type TopicKey,
  type TypeKey,
} from "./config";
import type { FetchOutcome, Resource, SheetIssue, SourceKind } from "./types";

/* ------------------------------------------------------------------
   1. 시트 컬럼 찾기
------------------------------------------------------------------- */

/**
 * 시트 1행의 헤더 문구 → 내부 필드 이름.
 * 열 순서가 바뀌어도 헤더 이름으로 찾으므로 안전합니다.
 * 담당 선생님이 헤더 문구를 바꾸면 여기만 고치면 됩니다.
 */
const HEADERS = {
  no: "연번",
  audience: "사용대상",
  type: "유형별",
  level: "학교급",
  subLevel: "학교급-하위",
  title: "자료명",
  summary: "자료소개(자료 내 문장 활용)",
  publisher: "발행기관",
  url: "자료링크",
  year: "발행연도",
  linkedFlag: "연계자료 여부",
  linkedNo: "연계자료 연번",
  linkedTarget: "연계자료 대상",
  user: "자료활용자",
  caution: "자료활용자(주의사항 및 참고사항 표기)",
} as const;

type FieldKey = keyof typeof HEADERS;

/** 비교 전에 공백을 모두 없앱니다. 헤더에 줄바꿈·뒤쪽 공백이 섞여 있기 때문입니다. */
const squash = (s: string) => s.replace(/\s+/g, "");

function locateColumns(header: string[]): Record<FieldKey, number> {
  const squashed = header.map(squash);
  const found = {} as Record<FieldKey, number>;
  const missing: string[] = [];

  for (const [field, label] of Object.entries(HEADERS) as [
    FieldKey,
    string,
  ][]) {
    const want = squash(label);
    // '자료활용자'와 '자료활용자(주의사항…)'가 둘 다 있으므로 정확히 일치하는 쪽을 먼저 찾습니다.
    let idx = squashed.indexOf(want);
    if (idx === -1) idx = squashed.findIndex((h) => h.startsWith(want));
    if (idx === -1) missing.push(label);
    else found[field] = idx;
  }

  if (missing.length > 0) {
    throw new Error(
      `구글 시트에서 다음 열을 찾지 못했습니다: ${missing.join(", ")}. ` +
        `시트 1행의 헤더 문구가 바뀌지 않았는지 확인해 주세요.`,
    );
  }
  return found;
}

/* ------------------------------------------------------------------
   2. 값 정규화
------------------------------------------------------------------- */

/**
 * 여러 값이 들어간 칸을 쉼표 또는 줄바꿈으로 나눕니다.
 *
 * ⚠️ 그냥 split(",") 하면 안 됩니다. 학교급에 `중등(중,고)` 처럼
 *    괄호 안에 쉼표가 든 값이 있어서 `중등(중` / `고)` 로 깨집니다.
 *    아래 정규식은 **괄호 밖에 있는** 쉼표·줄바꿈만 자릅니다.
 *    (연계자료 연번은 "26-2, 26-3⏎26-4" 처럼 줄바꿈이 섞여 있습니다)
 */
export function splitMulti(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[,\n\r](?![^(]*\))/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * 연계자료 연번의 **범위 표기**를 실제 연번 목록으로 펼칩니다.
 *
 *   "68-1~68-15" → ["68-1", "68-2", … "68-15"]
 *   "12~15"      → ["12", "13", "14", "15"]
 *
 * 시트에 연계자료가 열댓 개씩 딸린 자료가 있어, 담당 선생님이 쉼표로 나열하는 대신
 * 물결로 묶어 적어 두셨습니다. 그대로 두면 어떤 자료와도 이어지지 않습니다.
 * 앞자리가 다르거나(68-1~70-2) 숫자가 아니면 손대지 않고 원문을 그대로 둡니다.
 */
export function expandNoRange(token: string): string[] {
  const parts = token.split(/\s*[~〜～∼]\s*/);
  if (parts.length !== 2) return [token];

  const [from, to] = parts;
  // "68-1" 처럼 앞자리-뒷자리 형태이거나, 그냥 숫자이거나
  const parse = (v: string) => /^(?:(\d+)-)?(\d+)$/.exec(v);
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return [token];

  const prefix = a[1] ?? "";
  // 앞자리가 서로 다르면(68-1~70-3) 무엇을 뜻하는지 알 수 없어 그대로 둡니다.
  if (prefix !== (b[1] ?? "")) return [token];

  const start = Number(a[2]);
  const end = Number(b[2]);
  // 거꾸로 적혔거나 지나치게 넓으면 오타로 보고 원문 유지
  if (start > end || end - start > 200) return [token];

  const out: string[] = [];
  for (let n = start; n <= end; n++) out.push(prefix ? `${prefix}-${n}` : `${n}`);
  return out;
}

/** 사용대상 원문 → 필터 키 */
const AUDIENCE_LOOKUP = new Map<string, AudienceKey>(
  AUDIENCES.flatMap((a) => a.sheetValues.map((v) => [v, a.key] as const)),
);

/** 유형 원문 → 필터 키 */
const TYPE_LOOKUP = new Map<string, TypeKey>(
  RESOURCE_TYPES.map((t) => [t.label, t.key] as const),
);

/**
 * 학교급 원문 → 필터 키 목록.
 * 학교급(E열)은 큰 구분, 학교급-하위(F열)는 세부 구분이며
 * 하위에 값이 있으면 하위를 우선합니다.
 */
const LEVEL_LOOKUP: Record<string, LevelKey[]> = {
  "모든 학교": ["elem_low", "elem_high", "middle", "high"],
  전체: ["elem_low", "elem_high", "middle", "high"],
  초등: ["elem_low", "elem_high"],
  초등학교: ["elem_low", "elem_high"],
  "초등 저학년": ["elem_low"],
  "초등 고학년": ["elem_high"],
  "중등(중,고)": ["middle", "high"],
  중등: ["middle"],
  중학교: ["middle"],
  고등: ["high"],
  고등학교: ["high"],
};

const ALL_LEVELS: LevelKey[] = ["elem_low", "elem_high", "middle", "high"];

function expandLevels(
  level: string,
  subLevel: string,
): { levels: LevelKey[]; unmapped: string[] } {
  const source = splitMulti(subLevel).length > 0 ? subLevel : level;
  const out = new Set<LevelKey>();
  const unmapped: string[] = [];

  for (const token of splitMulti(source)) {
    const mapped = LEVEL_LOOKUP[token];
    if (mapped) mapped.forEach((k) => out.add(k));
    else unmapped.push(token);
  }

  // 학교급을 하나도 못 알아냈으면 '모든 학교'로 봅니다.
  // 그러지 않으면 그 자료는 어떤 학교급 필터에도 걸리지 않아 사라져 버립니다.
  // 다만 이 기본값이 오류를 감추지 않도록, 못 읽은 값은 unmapped 로 반드시 보고합니다.
  return { levels: out.size > 0 ? [...out] : ALL_LEVELS, unmapped };
}

/* ------------------------------------------------------------------
   3. CSV 한 장 → Resource[]
------------------------------------------------------------------- */

/* ------------------------------------------------------------------
   2-1. 링크 보정 자료 (public/snapshot/links.json)

   시트 칸에 '학생생활자료실' 처럼 글자로 링크를 걸면, 어떤 내보내기 형식으로도
   주소가 실려 오지 않습니다(CSV·HTML·JSON 모두 표시 글자만 옵니다).
   엑셀 내보내기에는 주소가 남아 있어서, 배포할 때 `npm run sync:links` 로
   미리 뽑아 둔 목록을 여기서 합칩니다. 연번도 함께 보정합니다 —
   gviz 는 숫자로 판단한 열의 "26-1" 같은 값을 빈칸으로 돌려주기 때문입니다.
------------------------------------------------------------------- */

export interface LinkHint {
  /** 같은 탭에서 '자료명이 있는 행' 중 몇 번째인지 */
  i: number;
  no: string;
  title: string;
  /** 링크 칸의 표시 글자 */
  label: string;
  url: string;
}

interface HintLookup {
  byIndex: LinkHint[];
  /** 제목이 그 탭에서 유일할 때만 담습니다 (같은 제목이 여러 개면 못 고름) */
  byTitle: Map<string, LinkHint>;
}

function buildLookup(hints: LinkHint[] = []): HintLookup {
  const byTitle = new Map<string, LinkHint>();
  const dup = new Set<string>();

  for (const hint of hints) {
    const key = squash(hint.title);
    if (byTitle.has(key) || dup.has(key)) {
      byTitle.delete(key);
      dup.add(key);
      continue;
    }
    byTitle.set(key, hint);
  }
  return { byIndex: hints, byTitle };
}

/**
 * 행 순서로 먼저 찾되, **제목이 같은지 반드시 확인**합니다.
 * 시트가 그 사이에 바뀌어 순서가 어긋났다면 제목으로 다시 찾고,
 * 그것도 안 되면 아무것도 돌려주지 않습니다.
 * (틀린 주소를 붙이는 것보다 링크가 없는 편이 낫습니다)
 */
function pickHint(
  lookup: HintLookup,
  index: number,
  title: string,
): LinkHint | undefined {
  const byIndex = lookup.byIndex[index];
  if (byIndex && squash(byIndex.title) === squash(title)) return byIndex;
  return lookup.byTitle.get(squash(title));
}

async function fetchLinkHints(): Promise<Partial<Record<TopicKey, LinkHint[]>>> {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  try {
    const res = await fetch(`${base}/snapshot/links.json`, { cache: "no-store" });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      topics?: Partial<Record<TopicKey, LinkHint[]>>;
    };
    return json.topics ?? {};
  } catch {
    // 링크 목록을 못 읽어도 사이트는 그대로 동작해야 합니다 (주소만 비어 있게 됨)
    return {};
  }
}

export function parseSheet(
  csv: string,
  topic: TopicKey,
  hints: LinkHint[] = [],
): { resources: Resource[]; issues: SheetIssue[] } {
  // header:false 로 읽습니다. 시트 오른쪽에 이름이 빈 열이 여러 개라
  // header:true 를 쓰면 키가 충돌합니다.
  const { data } = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (data.length === 0) return { resources: [], issues: [] };

  const col = locateColumns(data[0]);
  const resources: Resource[] = [];
  const issues: SheetIssue[] = [];

  const cell = (row: string[], field: FieldKey) => (row[col[field]] ?? "").trim();

  const lookup = buildLookup(hints);
  // 링크 목록도 '자료명이 있는 행'만 세므로 별도 번호가 필요합니다.
  let shown = 0;

  data.slice(1).forEach((row, i) => {
    const title = cell(row, "title");
    // 자료명이 비어 있는 행 = 아직 작성 중인 자리 → 사이트에 노출하지 않습니다.
    if (!title) return;

    const hint = pickHint(lookup, shown, title);
    shown++;

    // 연번이 비어 있으면 링크 목록의 값으로 채웁니다.
    // gviz 는 숫자 열로 판단한 칸의 "26-1" 같은 값을 빈칸으로 돌려주는데,
    // 그러면 연계자료가 서로를 찾지 못합니다.
    const no = cell(row, "no") || hint?.no || "";

    // 링크 칸이 주소면 그대로, 글자면 링크 목록에서 주소를 찾아 붙입니다.
    const rawUrl = cell(row, "url");
    const rawUrlIsAddress = /^https?:\/\//i.test(rawUrl);
    const url = rawUrlIsAddress ? rawUrl : (hint?.url ?? "");
    const urlLabel = rawUrlIsAddress ? "" : rawUrl;

    if (rawUrl && !url) {
      issues.push({ topic, no, column: "자료링크", value: rawUrl });
    }
    const rawAudience = cell(row, "audience");
    const rawType = cell(row, "type");
    const rawLevel = cell(row, "level");
    const rawSubLevel = cell(row, "subLevel");
    const summary = cell(row, "summary");
    const publisher = cell(row, "publisher");
    const year = cell(row, "year");

    const audiences = new Set<AudienceKey>();
    for (const token of splitMulti(rawAudience)) {
      const key = AUDIENCE_LOOKUP.get(token);
      if (key) audiences.add(key);
      else {
        audiences.add("common");
        issues.push({ topic, no, column: "사용대상", value: token });
      }
    }

    const types = new Set<TypeKey>();
    for (const token of splitMulti(rawType)) {
      const key = TYPE_LOOKUP.get(token);
      if (key) types.add(key);
      else {
        types.add("etc");
        issues.push({ topic, no, column: "유형별", value: token });
      }
    }

    const { levels, unmapped } = expandLevels(rawLevel, rawSubLevel);
    for (const value of unmapped) {
      issues.push({ topic, no, column: "학교급", value });
    }
    // 시트에서 채워야 할 빈칸 (모든 학교로 처리하되 운영자에게 알림)
    if (!rawLevel && !rawSubLevel) {
      issues.push({
        topic,
        no,
        column: "학교급",
        value: "(빈칸 → 모든 학교로 처리)",
      });
    }

    resources.push({
      id: `${topic}-${no || `row${i + 1}`}`,
      topic,
      no,
      order: i + 1,
      title,
      summary,
      publisher,
      url,
      urlLabel,
      year,
      yearRank: YEAR_RANK[year] ?? 0,
      user: cell(row, "user"),
      caution: cell(row, "caution"),
      hasLinked: cell(row, "linkedFlag") === "있음",
      linkedNos: splitMulti(cell(row, "linkedNo")).flatMap(expandNoRange),
      linkedTarget: cell(row, "linkedTarget"),
      audiences: [...audiences],
      types: [...types],
      levels,
      rawAudience,
      rawType,
      rawLevel,
      rawSubLevel,
      haystack: `${title} ${summary} ${publisher}`.toLowerCase(),
    });
  });

  return { resources, issues };
}

/* ------------------------------------------------------------------
   4. 불러오기 (실시간 → 실패 시 예비 스냅샷)
------------------------------------------------------------------- */

/**
 * gviz 엔드포인트. 브라우저에서 직접 호출할 수 있도록 CORS를 허용하고,
 * 캐시를 두지 않아 시트를 저장하면 곧바로 반영됩니다.
 */
function liveUrl(sheetName: string) {
  const name = encodeURIComponent(sheetName);
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${name}&_=${Date.now()}`;
}

/** 구글이 응답하지 않을 때 쓰는 예비 사본 (`npm run sync:snapshot` 으로 갱신) */
function snapshotUrl(topic: TopicKey) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}/snapshot/${topic}.csv`;
}

async function getCsv(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

/**
 * 4개 주제(=시트 탭)를 한꺼번에 불러옵니다.
 * 한 탭이 실패해도 나머지는 그대로 보여주고, 실패한 탭만 예비 사본으로 대체합니다.
 */
export async function fetchAllResources(): Promise<FetchOutcome> {
  const sources = {} as Record<TopicKey, SourceKind>;
  const resources: Resource[] = [];
  const issues: SheetIssue[] = [];

  // 시트 4개와 링크 목록을 동시에 받습니다.
  const [results, hints] = await Promise.all([
    Promise.all(
      TOPICS.map(async (topic) => {
        try {
          return {
            topic: topic.key,
            csv: await getCsv(liveUrl(topic.sheetName)),
            source: "live" as SourceKind,
          };
        } catch {
          try {
            return {
              topic: topic.key,
              csv: await getCsv(snapshotUrl(topic.key)),
              source: "snapshot" as SourceKind,
            };
          } catch {
            return { topic: topic.key, csv: "", source: "failed" as SourceKind };
          }
        }
      }),
    ),
    fetchLinkHints(),
  ]);

  for (const r of results) {
    sources[r.topic] = r.source;
    if (!r.csv) continue;
    try {
      const parsed = parseSheet(r.csv, r.topic, hints[r.topic] ?? []);
      resources.push(...parsed.resources);
      issues.push(...parsed.issues);
    } catch (e) {
      sources[r.topic] = "failed";
      issues.push({
        topic: r.topic,
        no: "-",
        column: "시트 구조",
        value: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { resources, fetchedAt: new Date(), sources, issues };
}
