"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllResources } from "./sheets";
import type { FetchOutcome } from "./types";

/**
 * 자료 목록은 169건뿐이라 **한 번 받아서 브라우저 메모리에 두고** 씁니다.
 * 그래서 필터를 눌러도 네트워크 요청이 없고, 화면을 옮겨 다녀도 다시 받지 않습니다.
 * 모듈 수준 변수라 페이지 이동에도 유지되고, 새로고침(F5)하면 초기화됩니다.
 */
let cache: FetchOutcome | null = null;
let inflight: Promise<FetchOutcome> | null = null;

export function useResources() {
  const [data, setData] = useState<FetchOutcome | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cache);

  const load = useCallback(async (force: boolean) => {
    if (!force && cache) {
      setData(cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    if (force) inflight = null;
    // 동시에 여러 컴포넌트가 호출해도 요청은 한 번만 나가도록 묶습니다.
    inflight ??= fetchAllResources();
    try {
      const result = await inflight;
      cache = result;
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "자료를 불러오지 못했습니다.");
    } finally {
      inflight = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    data,
    loading,
    error,
    /** 시트를 방금 수정했을 때 즉시 다시 불러오기 */
    refresh: () => load(true),
  };
}
