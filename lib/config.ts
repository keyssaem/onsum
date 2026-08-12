/**
 * 프로젝트 전역 설정 상수.
 * 구글 시트 구조가 바뀌면 이 파일만 고치면 됩니다.
 */

/** 자료 데이터베이스로 쓰는 구글 스프레드시트 ID */
export const SHEET_ID = "1HdOONWEalo5s6EY2yPjMuAY9f8G-EtulPuf0_0tmJsU";

/**
 * 주제별 필터 = 스프레드시트의 탭.
 * ⚠️ label 은 화면 표시용, sheetName 은 실제 탭 이름과 100% 일치해야 합니다.
 *    시트에서 탭 이름을 바꾸면 이 값도 함께 바꿔야 데이터가 끊기지 않습니다.
 */
export const TOPICS = [
  { key: "crisis", label: "위기(자해, 자살)", sheetName: "위기(자해 및 자살시도)" },
  { key: "violence", label: "폭력피해", sheetName: "폭력피해(학대 및 학교폭력)" },
  { key: "aftercare", label: "사후안정화", sheetName: "사후안정화(사안발생후)" },
  { key: "cne", label: "충남교육청 상담자료", sheetName: "충청남도교육청 개발자료" },
] as const;

export type TopicKey = (typeof TOPICS)[number]["key"];

/** 화면에 표시할 주제 이름 (탭 이름이 아니라 짧은 라벨) */
export const TOPIC_LABEL: Record<TopicKey, string> = Object.fromEntries(
  TOPICS.map((t) => [t.key, t.label]),
) as Record<TopicKey, string>;

/** 사용대상 필터. 시트의 '누구나'는 화면에서 '공통'으로 표기합니다. */
export const AUDIENCES = [
  { key: "guardian", label: "보호자", sheetValues: ["보호자"] },
  { key: "teacher", label: "교사", sheetValues: ["교사"] },
  { key: "student", label: "학생", sheetValues: ["학생"] },
  { key: "common", label: "공통", sheetValues: ["누구나", "유가족"] },
] as const;

/** 학교급 필터. 시트의 학교급(E열) + 학교급-하위(F열)를 아래 4단계로 전개합니다. */
export const SCHOOL_LEVELS = [
  { key: "elem_low", label: "초등 저" },
  { key: "elem_high", label: "초등 고" },
  { key: "middle", label: "중등" },
  { key: "high", label: "고등" },
] as const;

/** 유형별 필터. '포스터'는 시트에 실제로 존재하는 값이라 칩으로 노출합니다. */
export const RESOURCE_TYPES = [
  { key: "cardnews", label: "카드뉴스 및 뉴스레터" },
  { key: "education", label: "교육자료" },
  { key: "test", label: "심리검사" },
  { key: "video", label: "동영상" },
  { key: "worksheet", label: "활동지" },
  { key: "poster", label: "포스터" },
  { key: "etc", label: "기타" },
] as const;

/** 검색어 적용 범위 (검색창 왼쪽 드롭다운) */
export const SEARCH_SCOPES = [
  { key: "all", label: "전체" },
  { key: "title", label: "자료명" },
  { key: "summary", label: "자료소개" },
  { key: "publisher", label: "발행기관" },
] as const;

/** 검색 결과 정렬 기준 (결과 목록 오른쪽 위 드롭다운) */
export const SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "title", label: "이름순" },
] as const;

/** 한 번에 보여줄 자료 수 ([더보기] 를 누를 때마다 이만큼씩 늘어남) */
export const PAGE_SIZE = 12;

export type SortKey = (typeof SORT_OPTIONS)[number]["key"];
export type AudienceKey = (typeof AUDIENCES)[number]["key"];
export type LevelKey = (typeof SCHOOL_LEVELS)[number]["key"];
export type TypeKey = (typeof RESOURCE_TYPES)[number]["key"];
export type SearchScope = (typeof SEARCH_SCOPES)[number]["key"];

/** 키 → 화면에 보일 이름 (태그·상세 표시용) */
export const AUDIENCE_LABEL = Object.fromEntries(
  AUDIENCES.map((a) => [a.key, a.label]),
) as Record<AudienceKey, string>;

export const LEVEL_LABEL = Object.fromEntries(
  SCHOOL_LEVELS.map((s) => [s.key, s.label]),
) as Record<LevelKey, string>;

export const TYPE_LABEL = Object.fromEntries(
  RESOURCE_TYPES.map((t) => [t.key, t.label]),
) as Record<TypeKey, string>;

/**
 * 발행연도가 '2020~2024' 같은 구간 문자열이라 숫자 정렬이 불가능합니다.
 * 최신순 정렬을 위해 구간별 가중치를 부여합니다. (동점이면 연번 역순)
 */
export const YEAR_RANK: Record<string, number> = {
  "2025~": 3,
  "2020~2024": 2,
  "2015~2019": 1,
};

/** 우측 플로팅 버튼 링크 (Phase 5에서 실제 주소로 교체) */
export const EXTERNAL_LINKS = {
  /** 매뉴얼 한글(.hwp) 파일 — public/docs/ 에 넣고 경로 지정 */
  manual: "",
  /** 게시판 — 네이버폼 링크 */
  board: "",
} as const;

/** 입장 세션 유지 시간 (시간 단위) */
export const SESSION_HOURS = 12;
