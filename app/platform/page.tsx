import { Suspense } from "react";
import { PlatformScreen } from "@/components/platform/PlatformScreen";

/**
 * 검색 화면 (첨부5~8).
 *
 * 필터 상태를 주소(?topic=...&item=...)로 관리하기 때문에 useSearchParams 를 쓰고,
 * 정적 내보내기에서는 이를 Suspense 로 감싸야 합니다.
 */
export default function PlatformPage() {
  return (
    <Suspense fallback={null}>
      <PlatformScreen />
    </Suspense>
  );
}
