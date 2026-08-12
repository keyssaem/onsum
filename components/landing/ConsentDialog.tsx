"use client";

import { useEffect, useRef } from "react";
import {
  CONSENT_FOOTER,
  CONSENT_INTRO,
  CONSENT_SECTIONS,
  CONSENT_TABLE,
  CONSENT_TITLE,
} from "@/lib/consent";

interface Props {
  open: boolean;
  onClose: () => void;
  /** '동의하고 닫기'를 누르면 체크박스가 자동으로 켜집니다 */
  onAgree: () => void;
}

export function ConsentDialog({ open, onClose, onAgree }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // 뒤쪽 화면이 같이 스크롤되지 않도록
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-card bg-white p-6 shadow-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="consent-title" className="text-xl font-bold">
          {CONSENT_TITLE}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {CONSENT_INTRO}
        </p>

        <dl className="mt-5 overflow-hidden rounded-lg border border-line text-sm">
          {CONSENT_TABLE.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[100px_1fr] gap-3 p-3 md:grid-cols-[130px_1fr] ${
                i % 2 === 0 ? "bg-sky-50" : "bg-white"
              }`}
            >
              <dt className="font-semibold">{row.label}</dt>
              <dd className="text-ink-soft">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 space-y-4 text-sm">
          {CONSENT_SECTIONS.map((s) => (
            <section key={s.heading}>
              <h3 className="font-semibold">■ {s.heading}</h3>
              <p className="mt-1 leading-relaxed text-ink-soft">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-5 text-xs text-ink-faint">{CONSENT_FOOTER}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-chip border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-paper"
          >
            닫기
          </button>
          <button
            onClick={() => {
              onAgree();
              onClose();
            }}
            className="rounded-chip bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            동의하고 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
