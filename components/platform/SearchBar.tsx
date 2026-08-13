"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SEARCH_SCOPES, type SearchScope } from "@/lib/config";

interface Props {
  scope: SearchScope;
  query: string;
  onScopeChange: (scope: SearchScope) => void;
  onQueryChange: (query: string) => void;
}

/** 타이핑이 멈추고 이만큼 지나면 주소(?q=)에 반영하며 검색합니다. */
const PUSH_DELAY_MS = 250;

/** 검색 범위 선택 + 검색어 입력 (첨부5 상단) */
export function SearchBar({
  scope,
  query,
  onScopeChange,
  onQueryChange,
}: Props) {
  /*
    입력창에 보이는 글자는 이 컴포넌트가 직접 들고 있습니다(text).

    검색어는 주소(?q=)에 저장되는데, 주소를 바꾸고 그 값이 다시 내려오기까지는
    한 박자가 걸립니다(게다가 저장할 때 앞뒤 공백이 잘립니다).
    늦게 도착한 그 값을 입력창에 도로 써 넣으면 한글 조합이 중간에 끊깁니다.
    ㅅ → 서 → 성 으로 완성되어야 할 글자가 조합 도중 확정되어
    "ㅅ서성우울"처럼 자모가 흩어지던 원인이 이것입니다.

    그래서 타이핑하는 동안에는 바깥 값이 입력창을 건드리지 않게 하고,
    검색(주소 반영)만 조금 늦춰서 실행합니다.
  */
  const [text, setText] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(query);
  /** 한글 조합 중인지 (조합 중에는 입력창을 절대 건드리지 않습니다) */
  const composing = useRef(false);
  /** 마지막으로 위(주소)에 올려 보낸 값 */
  const lastSent = useRef(query);

  // 타이머가 터지는 시점의 최신 콜백을 쓰도록 해 둡니다.
  // (기다리는 사이에 다른 필터가 바뀌었을 수 있습니다)
  const onQueryChangeRef = useRef(onQueryChange);
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  });

  // 초기화 버튼·링크 이동처럼 '밖에서' 검색어가 바뀐 경우에만 입력창을 맞춥니다.
  useEffect(() => {
    if (composing.current) return; // 한글 조합 중 → 건드리면 자모가 깨집니다
    if (timer.current) return; // 아직 못 올린 입력이 있음 → 방금 친 글자가 우선
    if (query === text.trim()) return; // 이미 같은 값
    if (query === lastSent.current.trim()) return; // 내가 올린 값이 되돌아온 것
    latest.current = query;
    lastSent.current = query;
    setText(query);
  }, [query, text]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const schedulePush = useCallback((value: string) => {
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      lastSent.current = value;
      onQueryChangeRef.current(value);
    }, PUSH_DELAY_MS);
  }, []);

  /** 기다리는 검색이 남아 있으면 지금 바로 실행 (엔터·포커스 해제) */
  const flushPush = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    lastSent.current = latest.current;
    onQueryChangeRef.current(latest.current);
  }, []);

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
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            schedulePush(e.target.value);
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            // 조합이 끝난 글자를 확실히 반영합니다 (브라우저마다 이벤트 순서가 달라서)
            setText(e.currentTarget.value);
            schedulePush(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            // 한글 조합 중의 엔터는 글자를 확정하는 키라서 검색으로 가로채지 않습니다.
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              flushPush();
            }
          }}
          onBlur={flushPush}
          enterKeyHint="search"
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
