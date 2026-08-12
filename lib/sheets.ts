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

export function parseSheet(
  csv: string,
  topic: TopicKey,
): { resources: Resource[]; issues: SheetIssue[] } {
  // header:false 로 읽습니다. 시트 오른쪽에 이름이 빈 열이 여러 개라
  // header:true 를 쓰면 키가 충돌합니다.
  const { data } = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (data.length === 0) return { resources: [], issues: [] };

  const col = locateColumns(data[0]);
  const resources: Resource[] = [];
  const issues: SheetIssue[] = [];

  const cell = (row: string[], field: FieldKey) => (row[col[field]] ?? "").trim();

  data.slice(1).forEach((row, i) => {
    const title = cell(row, "title");
    // 자료명이 비어 있는 행 = 아직 작성 중인 자리 → 사이트에 노출하지 않습니다.
    if (!title) return;

    const no = cell(row, "no");
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
      url: cell(row, "url"),
      year,
      yearRank: YEAR_RANK[year] ?? 0,
      user: cell(row, "user"),
      caution: cell(row, "caution"),
      hasLinked: cell(row, "linkedFlag") === "있음",
      linkedNos: splitMulti(cell(row, "linkedNo")),
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

  const results = await Promise.all(
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
  );

  for (const r of results) {
    sources[r.topic] = r.source;
    if (!r.csv) continue;
    try {
      const parsed = parseSheet(r.csv, r.topic);
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
