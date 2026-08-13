import type { AudienceKey, LevelKey, TopicKey, TypeKey } from "./config";

/**
 * 구글 시트 1행(자료 1건)을 화면에서 쓰기 좋게 정규화한 형태.
 * 시트 원문은 `raw*` 필드에 그대로 남겨 상세 화면에 표시하고,
 * 필터링에는 키(`audiences` / `types` / `levels`)를 사용합니다.
 */
export interface Resource {
  /** 화면 이동·북마크에 쓰는 고유 id. 예: "crisis-12" */
  id: string;
  topic: TopicKey;
  /** 시트의 연번(B열). "1", "1-1" 같은 값 */
  no: string;
  /** 시트에서의 순서. 정렬 기준이 같을 때 이 값으로 순서를 유지 */
  order: number;

  /** 자료명(G열) — 카드와 상세의 제목 */
  title: string;
  /** 자료소개(H열) */
  summary: string;
  /** 발행기관(I열) */
  publisher: string;
  /**
   * 자료링크(J열)의 실제 주소.
   * 시트 칸에 글자로 링크가 걸려 있으면 CSV에는 주소가 실려 오지 않으므로,
   * 배포 때 만들어 둔 링크 목록(public/snapshot/links.json)에서 채웁니다.
   */
  url: string;
  /**
   * 링크 칸에 적혀 있던 표시 글자. 예: "학생생활자료실"
   * 주소가 글자로 직접 적혀 있던 경우에는 비어 있습니다.
   */
  urlLabel: string;
  /** 발행연도(K열) — "2020~2024" 같은 구간 문자열 */
  year: string;
  /** 최신순 정렬용 가중치 (2025~=3, 2020~2024=2, 2015~2019=1, 미기재=0) */
  yearRank: number;
  /** 자료활용자(O열) — "누구나" 또는 "전문인력" */
  user: string;
  /** 주의사항(P열) — 비어 있으면 상세에서 행 자체를 숨김 */
  caution: string;

  /** 연계자료 여부(L열) */
  hasLinked: boolean;
  /** 연계자료 연번(M열) — 같은 주제 안의 다른 자료를 가리킴 */
  linkedNos: string[];
  /** 연계자료 대상(N열) */
  linkedTarget: string;

  /** 필터용 키 */
  audiences: AudienceKey[];
  types: TypeKey[];
  levels: LevelKey[];

  /** 상세 화면에 그대로 보여줄 시트 원문 */
  rawAudience: string;
  rawType: string;
  rawLevel: string;
  rawSubLevel: string;

  /** 검색용 소문자 결합 문자열 (자료명 + 자료소개 + 발행기관) */
  haystack: string;
}

/** 시트 값이 정의된 필터에 매핑되지 않을 때 남기는 기록 (운영 점검용) */
export interface SheetIssue {
  topic: TopicKey;
  no: string;
  column: string;
  value: string;
}

export type SourceKind = "live" | "snapshot" | "failed";

export interface FetchOutcome {
  resources: Resource[];
  fetchedAt: Date;
  /** 주제별로 실시간 조회였는지, 예비 스냅샷이었는지 */
  sources: Record<TopicKey, SourceKind>;
  issues: SheetIssue[];
}
