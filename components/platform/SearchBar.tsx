"use client";

import { SEARCH_SCOPES, type SearchScope } from "@/lib/config";

interface Props {
  scope: SearchScope;
  query: string;
  onScopeChange: (scope: SearchScope) => void;
  onQueryChange: (query: string) => void;
}

/** 검색 범위 선택 + 검색어 입력 (첨부5 상단) */
export function SearchBar({
  scope,
  query,
  onScopeChange,
  onQueryChange,
}: Props) {
  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor="search-scope">
        검색 범위
      </label>
      <select
        id="search-scope"
        value={scope}
        onChange={(e) => onScopeChange(e.target.value as SearchScope)}
        className="shrink-0 rounded-chip border border-line bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-sky-400"
      >
        {SEARCH_SCOPES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="relative flex-1">
        <label className="sr-only" htmlFor="search-query">
          검색어
        </label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="자료명, 내용, 기관으로 검색"
          className="w-full rounded-chip border border-line bg-white py-2.5 pr-11 pl-4 text-sm outline-none placeholder:text-ink-faint focus:border-sky-400"
        />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-ink-faint"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
