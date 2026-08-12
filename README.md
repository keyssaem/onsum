# 함께 온(溫)숨

선생님을 위한 충남 학생 상담지원 플랫폼 · 충청남도청양교육지원청

위기사안을 겪는 학생을 지원하는 교직원이 상담 자료를 주제 · 사용대상 · 학교급 · 유형별로
찾아볼 수 있는 웹사이트입니다. 자료 데이터베이스는 구글 스프레드시트이며, 시트를 수정하면
사이트에 즉시 반영됩니다.

## 기술 구성

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) · TypeScript · 정적 내보내기 |
| 스타일 | Tailwind CSS v4 |
| 폰트 | Pretendard Variable 동적 서브셋 (SIL OFL 1.1) |
| 자료 DB | Google Sheets (gviz CSV · 브라우저에서 직접 조회) |
| 입장 기록 | Supabase (Postgres + RLS) |
| 배포 | GitHub Pages + GitHub Actions |

서버가 없는 순수 정적 사이트입니다. 호스팅 비용이 들지 않습니다.

## 시작하기

```bash
npm install
```

Supabase 키 설정 (Phase 4부터 필요) — [docs/Supabase-설정-가이드.md](docs/Supabase-설정-가이드.md) 참고

```bash
Copy-Item .env.local.example .env.local
```

개발 서버 실행

```bash
npm run dev
```

정적 빌드 (결과물은 `out/` 폴더)

```bash
npm run build
```

이미지 원본을 `image/`에 추가한 뒤 WebP로 변환 (웹에서 쓰는 파일 생성)

```bash
npm run sync:assets
```

구글 시트 예비 사본 갱신 (구글 장애 시에만 쓰이는 백업. 배포할 때 자동 실행됨)

```bash
npm run sync:snapshot
```

## 폴더 구조

```
app/
  layout.tsx          루트 레이아웃 · 폰트 · 메타데이터
  page.tsx            랜딩 화면 (히어로 · 입장 · 개발위원)
  platform/           검색 화면 (Phase 5에서 구현)
  check/              관리자용 데이터 점검 페이지 (링크 없음, 주소 직접 입력)
  not-found.tsx       404 페이지
  globals.css         디자인 토큰(색상 · 폰트 · 공통 스타일)
  fonts/              Pretendard 동적 서브셋 (92조각)
components/
  landing/            랜딩 3섹션 + 개인정보 동의 모달
  platform/           검색 화면 · 필터 · 결과 카드 · 자료 상세
  DandelionSeeds.tsx  배경 장식 애니메이션
lib/
  config.ts           시트 ID · 탭 이름 · 필터 정의  ← 운영 중 바뀌면 여기만 수정
  sheets.ts           구글 시트 조회 · CSV 파싱 · 값 정규화
  filters.ts          필터 규칙 · 주소(URL) 변환
  useResources.ts     자료 목록 세션 캐시 + 새로고침
  types.ts            자료(Resource) 타입 정의
  auth.ts             입장 인증 · 세션 관리
  supabase.ts         Supabase 클라이언트
  consent.ts          개인정보 동의 문구
  committee.ts        개발위원 명단
  assets.ts           이미지 정적 import
image/                디자인 원본 보관
assets/images/        WebP 변환본 (빌드에 포함, sync:assets가 생성)
public/snapshot/      구글 시트 예비 사본 (장애 대비)
supabase/schema.sql   데이터베이스 설정 (대시보드에서 1회 실행)
docs/                 설정 가이드 · 개인정보 문서
PLAN.md               전체 구현 계획서
```

## 운영자 안내 (구글 시트 관리)

자료 추가·수정은 [구글 스프레드시트](https://docs.google.com/spreadsheets/d/1HdOONWEalo5s6EY2yPjMuAY9f8G-EtulPuf0_0tmJsU/edit)에서 하며, 저장하면 사이트에 바로 반영됩니다.

**하면 안 되는 것**

- 1행 헤더 문구 변경
- 탭 이름 변경 (`lib/config.ts`의 `TOPICS`와 일치해야 함)
- 열 순서 변경
- 공유 설정을 "링크가 있는 모든 사용자"에서 해제

**참고**

- 자료명(G열)이 비어 있는 행은 사이트에 노출되지 않습니다.
- 학교급에 `중등(중,고)`처럼 괄호 안에 쉼표가 들어가도 정상 처리됩니다.

## 크레딧

- 이미지 디자인: 충남전문상담교사협의회 회장 유인선
- 폰트: [Pretendard](https://github.com/orioncactus/pretendard) — SIL Open Font License 1.1
