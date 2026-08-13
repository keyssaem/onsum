"use client";

import { TOPIC_LABEL } from "@/lib/config";
import type { Resource } from "@/lib/types";

interface Props {
  resource: Resource;
  /** 같은 주제 안에서 연번으로 이어진 자료들 */
  linked: Resource[];
  onBack: () => void;
  onSelect: (id: string) => void;
}

/** 값이 비어 있으면 그 줄을 아예 그리지 않습니다 (첨부7) */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
      <dt className="text-sm font-bold text-ink-soft">{label}</dt>
      <dd className="text-sm leading-relaxed break-words whitespace-pre-line">
        {children}
      </dd>
    </div>
  );
}

export function ResourceDetail({ resource: r, linked, onBack, onSelect }: Props) {
  // 실제 주소(http…)가 있을 때만 버튼으로 만듭니다.
  // 시트 칸에 '학생생활자료실'처럼 글자로 링크가 걸려 있던 경우, 주소는
  // links.json 에서 채워지고 그 글자는 urlLabel 로 남아 버튼 아래에 표시됩니다.
  const isLink = /^https?:\/\//i.test(r.url);

  return (
    <div className="rounded-card border border-line bg-white/95 p-5 shadow-sm backdrop-blur-sm md:p-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-chip border border-line px-3 py-1.5 text-sm font-semibold transition hover:bg-paper"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
          <path
            d="M15 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        목록으로
      </button>

      <p className="mt-5 text-xs font-semibold text-sky-600">
        {TOPIC_LABEL[r.topic]}
        {r.no && ` · 연번 ${r.no}`}
      </p>
      <h2 className="mt-1 text-2xl font-bold break-keep">{r.title}</h2>

      <dl className="mt-5">
        {(r.url || r.urlLabel) && (
          <Row label="자료 보기(링크)">
            {isLink ? (
              <>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-chip bg-sky-500 px-4 py-2 text-left font-semibold text-white transition hover:bg-sky-600"
                >
                  {/* 시트에 적혀 있던 링크 글자를 그대로 버튼 이름으로 씁니다 */}
                  <span className="min-w-0 break-keep">
                    {r.urlLabel || "자료 바로가기"}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="size-3.5 shrink-0"
                  >
                    <path
                      d="M7 17 17 7M9 7h8v8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <span className="mt-2 block text-xs break-all text-ink-faint">
                  {r.url}
                </span>
              </>
            ) : (
              // 주소를 끝내 찾지 못한 경우 — 시트에 적힌 글자만 보여줍니다
              <span>{r.urlLabel || r.url}</span>
            )}
          </Row>
        )}

        {r.summary && <Row label="자료소개">{r.summary}</Row>}
        {r.rawType && <Row label="자료형태">{r.rawType}</Row>}
        {r.publisher && <Row label="발행기관">{r.publisher}</Row>}
        {r.year && <Row label="발행년도">{r.year}</Row>}
       
        

        <Row label="연계자료">
          {linked.length > 0 ? (
            <ul className="space-y-1.5">
              {linked.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(l.id)}
                    className="text-left text-sky-600 underline underline-offset-2 hover:text-sky-700"
                  >
                    연번 {l.no} · {l.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : r.hasLinked ? (
            <span className="text-ink-soft">
              있음{r.linkedNos.length > 0 && ` (연번 ${r.linkedNos.join(", ")})`}
              {r.linkedTarget && ` · ${r.linkedTarget}`}
            </span>
          ) : (
            <span className="text-ink-faint">없음</span>
          )}
        </Row>

        {r.user && <Row label="활용자">{r.user}</Row>}

        {/* 주의사항 — 시트 P열(자료활용자(주의사항 및 참고사항 표기)). 값이 없어도 줄은 항상 표시 */}
        <Row label="주의사항">
          {r.caution ? (
            <span className="inline-block rounded-lg bg-blossom-50 px-3 py-2 text-blossom-500">
              {r.caution}
            </span>
          ) : (
            <span className="text-ink-faint">없음</span>
          )}
        </Row>
      </dl>
    </div>
  );
}
