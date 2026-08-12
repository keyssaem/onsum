"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { enterPlatform } from "@/lib/auth";
import { CONSENT_SUMMARY } from "@/lib/consent";
import { ConsentDialog } from "./ConsentDialog";

/**
 * 입력란 앞에 붙는 작은 민들레.
 * 좌표를 소수점 둘째 자리로 반올림합니다. 반올림하지 않으면 서버와 브라우저가
 * 같은 숫자를 다른 자릿수의 문자열로 적어 hydration 불일치 경고가 납니다.
 */
const round2 = (n: number) => Math.round(n * 100) / 100;

function Dandelion() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="4.2" fill="var(--color-dande-600)" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i * Math.PI) / 5;
        const cx = round2(12 + Math.cos(a) * 6.2);
        const cy = round2(12 + Math.sin(a) * 6.2);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="3.1"
            ry="2"
            fill="var(--color-dande-400)"
            transform={`rotate(${round2((i * 180) / 5)} ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}

/**
 * 두 번째 화면 (첨부3) — 플랫폼 소개 + 인증코드·실명 입력.
 */
export function EnterSection() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 인증코드를 계속 찍어보는 것을 막기 위한 잠금 (5회 실패 → 30초)
  const [failCount, setFailCount] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const timer = setTimeout(() => setLockLeft(lockLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [lockLeft]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || lockLeft > 0) return;

    setError(null);
    setSubmitting(true);
    const result = await enterPlatform(code, name);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "입장하지 못했습니다. 다시 시도해 주세요.");
      const next = failCount + 1;
      if (next >= 5) {
        setFailCount(0);
        setLockLeft(30);
      } else {
        setFailCount(next);
      }
      return;
    }
    router.push("/platform");
  }

  const canSubmit =
    agreed && code.trim() !== "" && name.trim() !== "" && lockLeft === 0;

  return (
    <section
      id="enter"
      className="scroll-mt-4 bg-gradient-to-b from-sky-50 to-white px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-base leading-loose text-ink md:text-lg">
          <b className="font-bold">함께 온숨</b>이란 위기사안을 겪는 학생들을
          지원하기 위해 노력하는 교직원들의 마음 속 어려움을 날려보내고, 학생
          성장을 돕는 봄날의 꽃을 피워냄을 의미합니다.
        </p>

        <p className="mt-12 text-base leading-loose text-ink md:text-lg">
          학생 상담지원 플랫폼의 안전한 사용을 위해
          <br />
          인증 코드 및 실명을 입력해주세요.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 max-w-sm space-y-3 text-left"
          noValidate
        >
          <div className="flex items-center gap-3">
            <Dandelion />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="인증 코드 입력란"
              autoComplete="off"
              aria-label="인증 코드"
              className="w-full rounded-lg border border-line bg-marker/40 px-4 py-3 text-base outline-none transition placeholder:text-ink-faint focus:border-sky-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <Dandelion />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="본인 실명 입력란"
              autoComplete="name"
              aria-label="본인 실명"
              className="w-full rounded-lg border border-line bg-marker/40 px-4 py-3 text-base outline-none transition placeholder:text-ink-faint focus:border-sky-400 focus:bg-white"
            />
          </div>

          <div className="pl-8">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-sky-500"
              />
              <span>
                <b className="font-semibold">(필수)</b> 개인정보 수집·이용에
                동의합니다.{" "}
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="text-sky-600 underline underline-offset-2"
                >
                  전문 보기
                </button>
              </span>
            </label>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
              {CONSENT_SUMMARY}
            </p>
          </div>

          {lockLeft > 0 ? (
            <p role="alert" className="pl-8 text-sm font-semibold text-blossom-500">
              여러 번 실패했습니다. {lockLeft}초 후 다시 시도해 주세요.
            </p>
          ) : (
            error && (
              <p role="alert" className="pl-8 text-sm font-semibold text-blossom-500">
                {error}
              </p>
            )
          )}

          <div className="pl-8 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full rounded-chip bg-dande-400 px-6 py-3 font-bold text-ink shadow-sm transition hover:bg-dande-500 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
            >
              {submitting
                ? "확인 중…"
                : lockLeft > 0
                  ? `${lockLeft}초 후 시도 가능`
                  : "입장하기"}
            </button>
          </div>
        </form>
      </div>

      <ConsentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAgree={() => setAgreed(true)}
      />
    </section>
  );
}
