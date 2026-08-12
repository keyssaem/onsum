"use client";

import { EXTERNAL_LINKS } from "@/lib/config";

/** 민들레 모양 아이콘 (플로팅 버튼용) */
function DandelionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="mx-auto size-5">
      <circle cx="12" cy="12" r="4" fill="var(--color-dande-600)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <ellipse
          key={deg}
          cx="12"
          cy="5.5"
          rx="2.6"
          ry="1.8"
          fill="var(--color-dande-400)"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

/**
 * 화면 오른쪽에 붙어 있는 바로가기 (첨부5 오른쪽).
 * 매뉴얼(한글 파일) · 게시판(네이버폼) 주소는 lib/config.ts 의 EXTERNAL_LINKS 에 넣으면
 * 자동으로 연결되고, 비어 있으면 '준비중'으로 표시합니다.
 */
export function FloatingNav() {
  const items = [
    { label: "매뉴얼", href: EXTERNAL_LINKS.manual, download: true },
    { label: "게시판", href: EXTERNAL_LINKS.board, download: false },
  ];

  return (
    <nav
      aria-label="바로가기"
      className="fixed top-1/2 right-2 z-30 w-16 -translate-y-1/2 overflow-hidden rounded-card border border-line bg-white/90 shadow-md backdrop-blur-sm md:right-4"
    >
      {items.map((item) =>
        item.href ? (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            {...(item.download ? { download: "" } : {})}
            className="block border-b border-line px-1 py-2.5 text-center text-xs font-semibold transition hover:bg-dande-50"
          >
            <DandelionIcon />
            <span className="mt-0.5 block">{item.label}</span>
          </a>
        ) : (
          <span
            key={item.label}
            title="준비중입니다"
            aria-disabled
            className="block cursor-not-allowed border-b border-line px-1 py-2.5 text-center text-xs font-semibold text-ink-faint opacity-60"
          >
            <DandelionIcon />
            <span className="mt-0.5 block">{item.label}</span>
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="block w-full bg-sky-400 px-1 py-2.5 text-center text-xs font-bold text-white transition hover:bg-sky-500"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="mx-auto size-4">
          <path
            d="M12 19V5M5 11l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="mt-0.5 block">Top</span>
      </button>
    </nav>
  );
}
