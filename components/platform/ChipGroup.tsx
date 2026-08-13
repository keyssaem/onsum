"use client";

interface Props<K extends string> {
  label: string;
  options: readonly { readonly key: K; readonly label: string }[];
  selected: readonly K[];
  onToggle: (key: K) => void;
}

/**
 * 필터 한 줄 (첨부5의 '주제별 / 사용대상 / 학교급별 / 유형별').
 * 같은 줄 안에서는 여러 개를 동시에 고를 수 있습니다.
 */
export function ChipGroup<K extends string>({
  label,
  options,
  selected,
  onToggle,
}: Props<K>) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/*
        바깥 span은 칩 줄맞춤용 고정 폭,
        형광펜은 안쪽 span에만 걸어 글자 폭만큼만 칠해지게 합니다.
      */}
      <span className="w-[4.5rem] shrink-0 text-sm font-bold md:text-base">
        <span className="marker-hl">{label}</span>
      </span>
      {options.map((opt) => {
        const on = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(opt.key)}
            className={`rounded-chip border px-3 py-1.5 text-sm transition ${
              on
                ? "border-dande-600 bg-dande-300 font-bold text-ink shadow-sm"
                : "border-dande-400 bg-white/85 text-ink-soft hover:border-dande-500 hover:bg-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
