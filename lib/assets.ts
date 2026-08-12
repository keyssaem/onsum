/**
 * 이미지 에셋을 정적 import 로 모아둡니다.
 *
 * 문자열 경로("/images/...") 대신 정적 import 를 쓰는 이유:
 * GitHub Pages 프로젝트 저장소로 배포하면 URL 앞에 /저장소명(basePath)이 붙는데,
 * 문자열 경로는 basePath가 자동으로 붙지 않아 이미지가 깨집니다.
 * 정적 import + next/image 조합은 Next.js가 경로를 알아서 맞춰줍니다.
 */
import bg1Chair from "@/assets/images/bg1_chair.webp";
import bg2Middle from "@/assets/images/bg2_middle.webp";
import bg3Footer from "@/assets/images/bg3_footer.webp";
import logo from "@/assets/images/logo.webp";

export const assets = {
  /** 첫 화면(랜딩) 히어로 배경 - 벤치에 앉은 토끼 */
  heroBg: bg1Chair,
  /** 인증 후 플랫폼 화면 배경 - 옅은 민들레 들판 */
  platformBg: bg2Middle,
  /** 하단 이미지 - 민들레를 부는 토끼 */
  footerBg: bg3Footer,
  /** 충청남도청양교육지원청 로고 */
  logo,
} as const;
