import Image from "next/image";
import Link from "next/link";
import { assets } from "@/lib/assets";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-white px-6 text-center">
      <Image
        src={assets.footerBg}
        alt=""
        placeholder="blur"
        sizes="(max-width: 640px) 100vw, 480px"
        className="h-auto w-full max-w-[480px] rounded-card"
      />
      <h1 className="mt-8 text-2xl font-bold">
        찾으시는 페이지가 없습니다
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        주소가 바뀌었거나 잘못 입력되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-chip bg-dande-400 px-6 py-3 text-sm font-bold text-ink transition hover:bg-dande-500"
      >
        첫 화면으로
      </Link>
    </main>
  );
}
