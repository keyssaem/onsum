import Image from "next/image";
import { assets } from "@/lib/assets";

/**
 * 페이지 맨 아래에 놓이는 푸터 (고정 아님 — 스크롤을 끝까지 내리면 보입니다).
 * 기관 로고와 저작권 문구를 표시합니다.
 */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-line bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-0.5 px-4 py-3 sm:flex-row sm:gap-4 md:py-4">
        <Image
          src={assets.logo}
          alt="충청남도청양교육지원청"
          className="h-auto w-[132px] shrink-0 md:w-[160px]"
        />
        <p className="text-[10px] text-ink-soft md:text-xs">
          Copyright ⓒ충청남도청양교육지원청. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
