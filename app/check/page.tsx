"use client";

import { useMemo } from "react";
import {
  AUDIENCES,
  RESOURCE_TYPES,
  SCHOOL_LEVELS,
  TOPICS,
  type AudienceKey,
  type LevelKey,
  type TypeKey,
} from "@/lib/config";
import { useResources } from "@/lib/useResources";

/**
 * 데이터 점검 페이지 (관리자용, 어디에도 링크되어 있지 않음 · 주소를 알아야 들어옴).
 *
 * 시트를 고친 뒤 "사이트에 제대로 반영됐는지", "필터에 안 잡히는 값은 없는지"를
 * 한눈에 확인하는 용도입니다. 자료 내용만 보여주므로 개인정보는 들어 있지 않습니다.
 */
export default function DataCheckPage() {
  const { data, loading, error, refresh } = useResources();

  const stats = useMemo(() => {
    if (!data) return null;
    const r = data.resources;
    const count = <K extends string>(
      keys: readonly { key: K; label: string }[],
      pick: (x: (typeof r)[number]) => readonly K[],
    ) =>
      keys.map((k) => ({
        label: k.label,
        n: r.filter((item) => pick(item).includes(k.key)).length,
      }));

    return {
      total: r.length,
      byTopic: TOPICS.map((t) => ({
        label: t.label,
        n: r.filter((x) => x.topic === t.key).length,
        source: data.sources[t.key],
      })),
      byAudience: count<AudienceKey>(AUDIENCES, (x) => x.audiences),
      byType: count<TypeKey>(RESOURCE_TYPES, (x) => x.types),
      byLevel: count<LevelKey>(SCHOOL_LEVELS, (x) => x.levels),
      noLevel: r.filter((x) => x.levels.length === 0).length,
      noUrl: r.filter((x) => !x.url).length,
      linked: r.filter((x) => x.hasLinked).length,
      users: [...new Set(r.map((x) => x.user || "(빈칸)"))],
      sample: r.find((x) => x.title.includes("스스로를 지키는")) ?? r[0],
    };
  }, [data]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold text-sky-600">관리자용 · 데이터 점검</p>
      <h1 className="mt-2 text-3xl font-bold">구글 시트 연동 확인</h1>
      <p className="mt-2 text-sm text-ink-soft">
        시트를 수정한 뒤 사이트에 제대로 반영됐는지, 필터에 안 잡히는 값은 없는지
        확인하는 화면입니다.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={refresh}
          className="rounded-chip bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
        >
          다시 불러오기
        </button>
        {data && (
          <span className="text-sm text-ink-soft">
            마지막 동기화 {data.fetchedAt.toLocaleTimeString("ko-KR")}
          </span>
        )}
      </div>

      {loading && <p className="mt-8 text-ink-soft">불러오는 중…</p>}
      {error && (
        <p className="mt-8 rounded-card bg-blossom-100 p-4 text-sm">{error}</p>
      )}

      {stats && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold">
              총 {stats.total}건{" "}
              <span className="text-sm font-normal text-ink-soft">
                (기대값 169건)
              </span>
            </h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {stats.byTopic.map((t) => (
                  <tr key={t.label} className="border-b border-line">
                    <td className="py-2">{t.label}</td>
                    <td className="py-2 text-right font-semibold">{t.n}건</td>
                    <td className="py-2 pl-4 text-right text-ink-faint">
                      {t.source === "live"
                        ? "실시간"
                        : t.source === "snapshot"
                          ? "예비 사본"
                          : "실패"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {(
            [
              ["사용대상", stats.byAudience],
              ["유형별", stats.byType],
              ["학교급별", stats.byLevel],
            ] as const
          ).map(([label, rows]) => (
            <section key={label}>
              <h2 className="text-lg font-bold">{label}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {rows.map((r) => (
                  <span
                    key={r.label}
                    className="rounded-chip border border-dande-400 px-3 py-1 text-sm"
                  >
                    {r.label}{" "}
                    <b className="text-dande-700">{r.n}</b>
                  </span>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-lg font-bold">이상 여부</h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li>학교급이 하나도 안 잡힌 자료: {stats.noLevel}건</li>
              <li>링크가 빈 자료: {stats.noUrl}건</li>
              <li>연계자료 있는 자료: {stats.linked}건</li>
              <li>자료활용자 값 종류: {stats.users.join(" / ")}</li>
              <li>
                매핑 실패한 값:{" "}
                {data && data.issues.length === 0 ? (
                  "없음"
                ) : (
                  <span className="text-blossom-500">
                    {data?.issues.length}건
                  </span>
                )}
              </li>
            </ul>
            {data && data.issues.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-card bg-blossom-50 p-3 text-xs">
                {data.issues.slice(0, 20).map((i, n) => (
                  <li key={n}>
                    [{i.topic} 연번 {i.no}] {i.column} = &ldquo;{i.value}&rdquo;
                  </li>
                ))}
              </ul>
            )}
          </section>

          {stats.sample && (
            <section>
              <h2 className="text-lg font-bold">
                상세 화면 필드 확인 (첨부7 대조용)
              </h2>
              <dl className="mt-2 space-y-2 rounded-card border border-line bg-white p-5 text-sm">
                {(
                  [
                    ["자료명", stats.sample.title],
                    ["자료 보기(링크)", stats.sample.url],
                    ["자료소개", stats.sample.summary],
                    ["자료형태", stats.sample.rawType],
                    ["발행기관", stats.sample.publisher],
                    ["발행년도", stats.sample.year],
                    [
                      "연계자료",
                      stats.sample.hasLinked
                        ? `있음 (연번 ${stats.sample.linkedNos.join(", ")})`
                        : "없음",
                    ],
                    ["활용자", stats.sample.user],
                    ["주의사항", stats.sample.caution || "(없음 → 상세에서 숨김)"],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] gap-3">
                    <dt className="font-semibold text-ink-soft">{k}</dt>
                    <dd className="break-all">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
