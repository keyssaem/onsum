import {
  AUDIENCES,
  RESOURCE_TYPES,
  SCHOOL_LEVELS,
  SEARCH_SCOPES,
  SORT_OPTIONS,
  TOPICS,
  type AudienceKey,
  type LevelKey,
  type SearchScope,
  type SortKey,
  type TopicKey,
  type TypeKey,
} from "./config";
import type { Resource } from "./types";

export interface FilterState {
  topics: TopicKey[];
  audiences: AudienceKey[];
  levels: LevelKey[];
  types: TypeKey[];
  query: string;
  scope: SearchScope;
  sort: SortKey;
}

export const EMPTY_FILTERS: FilterState = {
  topics: [],
  audiences: [],
  levels: [],
  types: [],
  query: "",
  scope: "all",
  sort: "recent",
};

/**
 * 아직 아무 조건도 고르지 않은 상태 (= 첨부8 하단 이미지를 보여줄 때).
 * 정렬은 조건이 아니므로 여기서 따지지 않습니다.
 */
export function isPristine(f: FilterState): boolean {
  return (
    f.topics.length === 0 &&
    f.audiences.length === 0 &&
    f.levels.length === 0 &&
    f.types.length === 0 &&
    f.query.trim() === ""
  );
}

const TOPIC_ORDER = new Map<TopicKey, number>(
  TOPICS.map((t, i) => [t.key, i] as const),
);

/**
 * 정렬.
 * 발행연도가 "2020~2024" 같은 구간 문자열이라 숫자로 비교할 수 없어,
 * 파싱 단계에서 매겨둔 yearRank(2025~=3, 2020~2024=2, 2015~2019=1)를 씁니다.
 */
export function sortResources(list: Resource[], sort: SortKey): Resource[] {
  const sorted = [...list];
  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  } else if (sort === "no") {
    sorted.sort(
      (a, b) =>
        (TOPIC_ORDER.get(a.topic) ?? 0) - (TOPIC_ORDER.get(b.topic) ?? 0) ||
        a.order - b.order,
    );
  } else {
    // 최신순: 발행연도 구간이 최근일수록 앞, 같으면 시트에서 나중에 적힌 것이 앞
    sorted.sort((a, b) => b.yearRank - a.yearRank || b.order - a.order);
  }
  return sorted;
}

function matchesQuery(r: Resource, query: string, scope: SearchScope): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const target =
    scope === "title"
      ? r.title
      : scope === "summary"
        ? r.summary
        : scope === "publisher"
          ? r.publisher
          : r.haystack;
  return target.toLowerCase().includes(q);
}

/**
 * 같은 줄(그룹) 안에서는 OR, 서로 다른 줄끼리는 AND 로 걸립니다.
 * 예) [교사] + [동영상] → "교사용이면서 동영상인 자료"
 *     [교사, 학생]      → "교사용이거나 학생용인 자료"
 * 아무것도 고르지 않은 줄은 조건에서 빠집니다.
 */
export function applyFilters(list: Resource[], f: FilterState): Resource[] {
  return list.filter(
    (r) =>
      (f.topics.length === 0 || f.topics.includes(r.topic)) &&
      (f.audiences.length === 0 ||
        r.audiences.some((a) => f.audiences.includes(a))) &&
      (f.levels.length === 0 || r.levels.some((l) => f.levels.includes(l))) &&
      (f.types.length === 0 || r.types.some((t) => f.types.includes(t))) &&
      matchesQuery(r, f.query, f.scope),
  );
}

/* ------------------------------------------------------------------
   URL 주소와 필터 상태를 서로 변환합니다.
   조건을 주소에 담아두면 뒤로가기로 검색 결과가 되살아나고,
   선생님들끼리 검색 결과 링크를 그대로 공유할 수 있습니다.
------------------------------------------------------------------- */

const VALID = {
  topic: new Set<string>(TOPICS.map((t) => t.key)),
  audience: new Set<string>(AUDIENCES.map((a) => a.key)),
  level: new Set<string>(SCHOOL_LEVELS.map((s) => s.key)),
  type: new Set<string>(RESOURCE_TYPES.map((t) => t.key)),
  scope: new Set<string>(SEARCH_SCOPES.map((s) => s.key)),
  sort: new Set<string>(SORT_OPTIONS.map((s) => s.key)),
};

/** 주소에 이상한 값이 들어와도 무시하도록 걸러냅니다 */
function readKeys<K extends string>(
  params: URLSearchParams,
  name: string,
  valid: Set<string>,
): K[] {
  const raw = params.get(name);
  if (!raw) return [];
  return raw.split(",").filter((v) => valid.has(v)) as K[];
}

export function parseFilters(params: URLSearchParams): FilterState {
  const scope = params.get("scope") ?? "";
  const sort = params.get("sort") ?? "";
  return {
    topics: readKeys<TopicKey>(params, "topic", VALID.topic),
    audiences: readKeys<AudienceKey>(params, "audience", VALID.audience),
    levels: readKeys<LevelKey>(params, "level", VALID.level),
    types: readKeys<TypeKey>(params, "type", VALID.type),
    query: params.get("q") ?? "",
    scope: (VALID.scope.has(scope) ? scope : "all") as SearchScope,
    sort: (VALID.sort.has(sort) ? sort : "recent") as SortKey,
  };
}

/** 필터 상태를 주소 문자열로. 비어 있는 항목은 주소에 넣지 않아 짧게 유지합니다. */
export function filtersToQuery(f: FilterState, itemId?: string): string {
  const p = new URLSearchParams();
  if (f.topics.length) p.set("topic", f.topics.join(","));
  if (f.audiences.length) p.set("audience", f.audiences.join(","));
  if (f.levels.length) p.set("level", f.levels.join(","));
  if (f.types.length) p.set("type", f.types.join(","));
  if (f.query.trim()) p.set("q", f.query.trim());
  if (f.scope !== "all") p.set("scope", f.scope);
  if (f.sort !== "recent") p.set("sort", f.sort);
  if (itemId) p.set("item", itemId);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** 배열에서 값을 넣거나 빼는 토글 */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
