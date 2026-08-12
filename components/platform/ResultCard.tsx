"use client";

import { TOPIC_LABEL, TYPE_LABEL, type TypeKey } from "@/lib/config";
import type { Resource } from "@/lib/types";

/**
 * 자료 종류별 카드 윗부분 색.
 * 썸네일 이미지를 쓰지 않기로 했으므로(2026-08-13 확정) 색과 자료명 글자로 구분합니다.
 */
const TYPE_BG: Record<TypeKey, string> = {
  cardnews: "bg-blossom-100",
  education: "bg-sky-100",
  test: "bg-leaf-100",
  video: "bg-dande-100",
  worksheet: "bg-sky-50",
  poster: "bg-blossom-50",
  etc: "bg-paper",
};

interface Props {
  resource: Resource;
  onSelect: (id: string) => void;
}

/** 카드 아래쪽 정보 한 줄 (활용자 / 자료형태) */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[3.4rem_1fr] gap-1.5 md:grid-cols-[4rem_1fr]">
      <dt className="text-[11px] font-bold text-ink-faint md:text-xs">
        {label}
      </dt>
      <dd className="line-clamp-1 text-xs font-bold break-keep text-ink md:text-sm">
        {value}
      </dd>
    </div>
  );
}

export function ResultCard({ resource: r, onSelect }: Props) {
  const bg = TYPE_BG[r.types[0] ?? "etc"];
  const typeText = r.types.map((t) => TYPE_LABEL[t]).join(", ");

  return (
    <button
      type="button"
      onClick={() => onSelect(r.id)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-card border border-line bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-dande-400 hover:shadow-md"
    >
      {/* 썸네일 자리 — 이미지 대신 자료명 (2026-08-13 확정) */}
      <div
        className={`flex min-h-[4.75rem] flex-1 items-center justify-center px-3 py-3.5 md:min-h-[5.5rem] ${bg}`}
      >
        <span className="line-clamp-3 text-center text-sm font-bold break-keep text-ink md:text-[0.95rem]">
          {r.title}
        </span>
      </div>

      <div className="border-t border-line p-2.5">
        <dl className="space-y-1">
          <InfoRow label="활용자" value={r.user || "누구나"} />
          <InfoRow label="자료형태" value={typeText || "기타"} />
        </dl>
        <p className="mt-1.5">
          <span className="rounded-chip bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 md:text-[11px]">
            {TOPIC_LABEL[r.topic]}
          </span>
        </p>
      </div>
    </button>
  );
}
