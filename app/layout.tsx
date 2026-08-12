import type { Metadata, Viewport } from "next";
/**
 * Pretendard Variable 셀프 호스팅 (동적 서브셋).
 *
 * 전체 통짜 폰트는 2MB라 첫 방문이 느립니다. 동적 서브셋은 92개 조각으로 나뉘어
 * 있고 unicode-range 규칙에 따라 **화면에 실제로 쓰인 글자가 든 조각만** 내려받아
 * 보통 200~300KB로 끝납니다.
 *
 * CSS를 이렇게 import 하면 번들러가 상대경로 url()을 처리해 주므로,
 * GitHub Pages에서 URL 앞에 /저장소명(basePath)이 붙어도 폰트가 깨지지 않습니다.
 * 라이선스: SIL Open Font License 1.1 (상업적 이용 · 웹폰트 임베딩 허용)
 */
import "./fonts/pretendard.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "함께 온(溫)숨 | 선생님을 위한 충남 학생 상담지원 플랫폼",
  description:
    "위기사안을 겪는 학생들을 지원하는 교직원을 위한 상담자료 검색 플랫폼입니다. 주제 · 사용대상 · 학교급 · 유형별로 자료를 찾아보세요.",
  keywords: ["학생상담", "위기학생", "충남교육청", "청양교육지원청", "상담자료"],
  openGraph: {
    title: "함께 온(溫)숨",
    description: "선생님을 위한 충남 학생 상담지원 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: "#6ec3ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
