import { CommitteeSection } from "@/components/landing/CommitteeSection";
import { EnterSection } from "@/components/landing/EnterSection";
import { HeroSection } from "@/components/landing/HeroSection";

/**
 * 랜딩 화면 — 아래로 스크롤하며 세 부분을 봅니다.
 *   1) 첨부1·2 : 일러스트 + 플랫폼 이름
 *   2) 첨부3   : 플랫폼 소개 + 인증코드·실명 입력
 *   3) 첨부4   : 개발위원 명단
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <EnterSection />
      <CommitteeSection />
    </>
  );
}
