import type { NextConfig } from "next";

/**
 * GitHub Pages 정적 배포 설정.
 *
 * - output: "export"  → 서버 없는 순수 정적 사이트로 빌드 (out/ 폴더)
 * - basePath          → 프로젝트 저장소 페이지(https://아이디.github.io/저장소명)로
 *                       배포할 때 필요. GitHub Actions에서 NEXT_PUBLIC_BASE_PATH로 주입.
 *                       사용자 페이지(아이디.github.io)나 커스텀 도메인이면 빈 값.
 * - images.unoptimized → 정적 배포에는 이미지 최적화 서버가 없으므로 필수.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
