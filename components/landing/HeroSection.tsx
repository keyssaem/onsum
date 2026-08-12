import Image from "next/image";
import { assets } from "@/lib/assets";
import { DandelionSeeds } from "@/components/DandelionSeeds";

/**
 * 첫 화면 (첨부1 이미지 + 첨부2 배치).
 *
 * 일러스트는 **원본 비율 그대로** 넓이에 맞춰 들어갑니다(잘라내지 않음).
 * 그래서 화면이 좁든 넓든 벤치·토끼·학교가 항상 다 보입니다.
 *   - 넓은 화면: 그림 오른쪽 하늘 위에 제목을 얹습니다 (첨부2와 같은 배치)
 *   - 좁은 화면: 그림 아래로 제목을 내립니다. 그림이 세로로 짧아져
 *     글자를 얹으면 겹치기 때문입니다.
 */
export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-sky-100 to-sky-50">
      <div className="relative mx-auto max-w-[2560px]">
        {/* 그림 영역 — 이 안에서만 절대배치를 씁니다 */}
        <div className="relative">
          <Image
            src={assets.heroBg}
            alt="민들레가 핀 학교 앞 산책로 벤치에 앉아 민들레 홀씨를 부는 토끼 그림"
            priority
            placeholder="blur"
            sizes="100vw"
            className="h-auto w-full"
          />

          <DandelionSeeds />

          {/* 넓은 화면에서 글자 뒤 가독성을 확보하는 그라데이션 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-gradient-to-l from-white/75 via-white/25 to-transparent md:block"
          />

          {/* 그림 위에 얹히므로 옅은 흰 바탕을 깔아 읽히게 합니다 */}
          
        </div>

        {/* 제목 — 좁은 화면은 그림 아래, 넓은 화면은 그림 위 오른쪽 */}
        <div className="md:absolute md:inset-0 md:flex md:items-center md:justify-end md:px-12 lg:px-24">
          <div className="px-6 pt-10 text-center md:max-w-xl md:p-0 md:text-right">
            <h1 className="text-shadow-soft text-4xl font-black tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
              함께 온(溫)숨
            </h1>
            <p className="text-shadow-soft mt-5 text-lg font-semibold text-ink-soft md:mt-8 md:text-xl lg:text-2xl">
              선생님을 위한
              <br />
              충남 학생 상담지원 플랫폼
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-12 text-center md:pt-10 md:pb-16">
        <a
          href="#enter"
          className="inline-flex items-center gap-2 rounded-chip bg-white/85 px-6 py-3 text-sm font-semibold text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          시작하기
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="animate-nudge"
          >
            <path
              d="M12 5v14M5 13l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
