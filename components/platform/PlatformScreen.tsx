"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { assets } from "@/lib/assets";
import { clearSession, getSession } from "@/lib/auth";
import {
  AUDIENCES,
  PAGE_SIZE,
  RESOURCE_TYPES,
  SCHOOL_LEVELS,
  SORT_OPTIONS,
  TOPICS,
  type SortKey,
} from "@/lib/config";
import {
  applyFilters,
  EMPTY_FILTERS,
  filtersToQuery,
  isPristine,
  parseFilters,
  sortResources,
  toggle,
  type FilterState,
} from "@/lib/filters";
import { useResources } from "@/lib/useResources";
import { ChipGroup } from "./ChipGroup";
import { FloatingNav } from "./FloatingNav";
import { ResourceDetail } from "./ResourceDetail";
import { ResultCard } from "./ResultCard";
import { SearchBar } from "./SearchBar";
import { SiteFooter } from "./SiteFooter";

export function PlatformScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, loading, error, refresh } = useResources();
  const [name, setName] = useState<string | null>(null);

  // 입장하지 않은 사람은 첫 화면으로 되돌립니다.
  useEffect(() => {
    const session = getSession();
    if (!session) router.replace("/");
    else setName(session.name);
  }, [router]);

  // 필터 상태는 주소(?topic=...&q=...)에 담아둡니다.
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const itemId = searchParams.get("item");

  const setFilters = useCallback(
    (next: FilterState) => {
      router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false });
    },
    [router, pathname],
  );

  const openItem = useCallback(
    (id: string) => {
      router.push(`${pathname}${filtersToQuery(filters, id)}`, {
        scroll: false,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, pathname, filters],
  );

  const closeItem = useCallback(() => {
    router.replace(`${pathname}${filtersToQuery(filters)}`, { scroll: false });
  }, [router, pathname, filters]);

  const all = data?.resources ?? [];
  const results = useMemo(
    () => sortResources(applyFilters(all, filters), filters.sort),
    [all, filters],
  );
  const pristine = isPristine(filters);

  // 한 페이지에 12개씩, 페이지를 넘겨 봅니다. 조건이 바뀌면 1페이지로 돌아갑니다.
  const [page, setPage] = useState(1);
  const filterKey = filtersToQuery(filters);
  useEffect(() => setPage(1), [filterKey]);

  // 좁은 화면에서 검색 기준 접기/펴기
  const [panelOpen, setPanelOpen] = useState(true);
  const selectedCount =
    filters.topics.length +
    filters.audiences.length +
    filters.levels.length +
    filters.types.length;

  const selected = itemId ? all.find((r) => r.id === itemId) : undefined;
  const linked = useMemo(() => {
    if (!selected?.hasLinked || selected.linkedNos.length === 0) return [];
    return all.filter(
      (r) =>
        r.topic === selected.topic &&
        r.id !== selected.id &&
        selected.linkedNos.includes(r.no),
    );
  }, [all, selected]);

  if (!name) return null;

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = results.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const goPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    // 페이지를 넘기면 결과 목록 맨 위에서 다시 보게 합니다
    document
      .querySelector('section[aria-label="자료 목록"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative flex min-h-svh flex-col">
      {/*
        배경 일러스트를 화면 전체에 고정으로 깔아,
        어디까지 내려가도 카드가 항상 배경 위에 있게 합니다.
      */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <Image
          src={assets.platformBg}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover"
        />
        {/* 글자·카드 가독성을 위한 아주 옅은 흰 막 */}
        <div className="absolute inset-0 bg-white/25" />
      </div>

      <FloatingNav />

      {/* flex-1 + w-full: 내용이 짧아도 푸터가 화면 맨 아래에 놓이게 합니다 */}
      <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 pr-20 md:px-6 md:py-10 md:pr-24">
        {/*
          flex-col-reverse: 좁은 화면에서는 이름·나가기가 제목보다 위(우측 정렬)로,
          넓은 화면(sm~)에서는 제목 오른쪽에 놓입니다. 어느 폭에서든 항상 우측 상단.
        */}
        <header className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {/* 형광펜은 안쪽 inline span에만 걸어 글자 폭만큼 칠해지게 합니다 */}
            <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
              <span className="marker-hl">학생 상담지원 플랫폼 [함께 온(溫)숨]</span>
            </h1>
            {/* block + w-fit: 제목과 같은 줄에 붙지 않고 항상 제목 아래에 놓입니다 */}
            <div className="mt-3 block w-fit rounded-lg bg-white/85 px-4 py-2.5 text-xs leading-relaxed backdrop-blur-sm md:text-sm">
              <b className="font-bold">이용 안내</b>
              <br />
              하단 필터에서 주제, 사용대상, 학교급, 유형을 고르면
              <br />
              알맞은 자료와 교육영상이 실시간 연동됩니다.
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 text-xs">
            <span className="rounded-chip bg-white/85 px-3 py-2.5 font-semibold backdrop-blur-sm">
              {name} 선생님
            </span>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.replace("/");
              }}
              className="rounded-chip border border-line bg-white/85 px-3 py-2.5 font-semibold text-ink-soft backdrop-blur-sm transition hover:bg-white"
            >
              시작 화면으로
            </button>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,23rem)_1fr]">
          {/* ------------------------------ 검색 기준 */}
          <section aria-label="검색 기준">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                <span className="marker-hl">검색 기준</span>
              </h2>
              {/*
                좁은 화면에서는 필터가 세로로 길어져 결과를 보려면 한참 내려야 합니다.
                접을 수 있게 해 두고, 넓은 화면(lg)에서는 항상 펼쳐둡니다.
              */}
              <button
                type="button"
                onClick={() => setPanelOpen(!panelOpen)}
                aria-expanded={panelOpen}
                className="min-h-11 rounded-chip border border-line bg-white/85 px-3 py-2.5 text-xs font-semibold backdrop-blur-sm lg:hidden"
              >
                {panelOpen ? "접기" : `펴기${selectedCount ? ` (${selectedCount})` : ""}`}
              </button>
            </div>

            <div
              className={`mt-4 space-y-4 ${panelOpen ? "" : "hidden"} lg:block`}
            >
              <SearchBar
                scope={filters.scope}
                query={filters.query}
                onScopeChange={(scope) => setFilters({ ...filters, scope })}
                onQueryChange={(query) => setFilters({ ...filters, query })}
              />

              <ChipGroup
                label="주제별"
                options={TOPICS}
                selected={filters.topics}
                onToggle={(k) =>
                  setFilters({ ...filters, topics: toggle(filters.topics, k) })
                }
              />
              <ChipGroup
                label="사용대상"
                options={AUDIENCES}
                selected={filters.audiences}
                onToggle={(k) =>
                  setFilters({
                    ...filters,
                    audiences: toggle(filters.audiences, k),
                  })
                }
              />
              <ChipGroup
                label="학교급별"
                options={SCHOOL_LEVELS}
                selected={filters.levels}
                onToggle={(k) =>
                  setFilters({ ...filters, levels: toggle(filters.levels, k) })
                }
              />
              <ChipGroup
                label="유형별"
                options={RESOURCE_TYPES}
                selected={filters.types}
                onToggle={(k) =>
                  setFilters({ ...filters, types: toggle(filters.types, k) })
                }
              />

              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                disabled={pristine}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-chip px-3 py-2.5 text-sm font-bold text-blossom-500 transition hover:bg-blossom-50 disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
                  <path
                    d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                초기화
              </button>
            </div>
          </section>

          {/* ------------------------------ 결과 */}
          <section aria-label="자료 목록" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                <span className="marker-hl">
                  {pristine ? "자료 목록" : "검색 결과"}
                </span>
              </h2>
              {!pristine && !loading && !selected && (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-ink-soft">
                    총 {results.length}건
                  </p>
                  <label className="sr-only" htmlFor="sort">
                    정렬 기준
                  </label>
                  <select
                    id="sort"
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sort: e.target.value as SortKey,
                      })
                    }
                    className="min-h-11 rounded-chip border border-line bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-400"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4">
              {loading && (
                <p className="rounded-card bg-white/85 p-8 text-center text-sm text-ink-soft backdrop-blur-sm">
                  자료를 불러오는 중입니다…
                </p>
              )}

              {error && (
                <div className="rounded-card bg-white/90 p-6 text-center text-sm backdrop-blur-sm">
                  <p className="font-semibold text-blossom-500">{error}</p>
                  <button
                    type="button"
                    onClick={refresh}
                    className="mt-3 rounded-chip bg-sky-500 px-4 py-2 font-semibold text-white"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {!loading && !error && selected && (
                <ResourceDetail
                  resource={selected}
                  linked={linked}
                  onBack={closeItem}
                  onSelect={openItem}
                />
              )}

              {!loading && !error && !selected && pristine && (
                <div className="rounded-card bg-white/85 p-8 text-center backdrop-blur-sm">
                  <p className="text-sm leading-relaxed text-ink-soft">
                    왼쪽에서 검색 기준을 선택해 주세요.
                    <br />
                    조건을 고르면 알맞은 자료가 바로 나타납니다.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        ...EMPTY_FILTERS,
                        topics: TOPICS.map((t) => t.key),
                      })
                    }
                    className="mt-4 rounded-chip bg-dande-400 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-dande-500"
                  >
                    전체 자료 {all.length}건 보기
                  </button>
                </div>
              )}

              {!loading && !error && !selected && !pristine && (
                <>
                  {results.length === 0 ? (
                    <div className="rounded-card bg-white/85 p-8 text-center backdrop-blur-sm">
                      <p className="text-sm text-ink-soft">
                        조건에 맞는 자료가 없습니다. 필터를 줄여보세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilters(EMPTY_FILTERS)}
                        className="mt-4 rounded-chip border border-line bg-white px-4 py-2 text-sm font-semibold"
                      >
                        초기화
                      </button>
                    </div>
                  ) : (
                    <>
                      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                        {pageItems.map((r) => (
                          <li key={r.id}>
                            <ResultCard resource={r} onSelect={openItem} />
                          </li>
                        ))}
                      </ul>

                      {totalPages > 1 && (
                        <nav
                          aria-label="페이지 이동"
                          className="mt-6 flex items-center justify-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => goPage(safePage - 1)}
                            disabled={safePage === 1}
                            className="min-h-11 rounded-chip border border-line bg-white px-3.5 py-2.5 text-sm font-bold shadow-sm transition hover:bg-dande-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ◀ 이전
                          </button>

                          <span className="rounded-chip bg-white/90 px-4 py-2.5 text-sm font-bold shadow-sm">
                            페이지 {safePage} / {totalPages}
                          </span>

                          <button
                            type="button"
                            onClick={() => goPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            className="min-h-11 rounded-chip border border-line bg-white px-3.5 py-2.5 text-sm font-bold shadow-sm transition hover:bg-dande-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            다음 ▶
                          </button>
                        </nav>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {data && (
              <p className="mt-4 text-right text-[11px] text-ink-faint">
                마지막 동기화 {data.fetchedAt.toLocaleTimeString("ko-KR")}
                <button
                  type="button"
                  onClick={refresh}
                  className="ml-2 underline underline-offset-2 hover:text-ink-soft"
                >
                  새로고침
                </button>
              </p>
            )}
          </section>
        </div>
      </div>


      <SiteFooter />
    </main>
  );
}
