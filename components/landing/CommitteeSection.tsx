import Image from "next/image";
import { assets } from "@/lib/assets";
import { COMMITTEE } from "@/lib/committee";

/**
 * 세 번째 화면 (첨부4) — 개발위원 명단 + 기관 로고.
 */
export function CommitteeSection() {
  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold">개발위원</h2>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {COMMITTEE.map((group) => (
            <div key={group.group}>
              <h3 className="text-base font-bold">
                <span className="marker-hl">{group.group}</span>
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
                {group.members.map((m) => (
                  <li key={`${m.name}-${m.affiliation}`}>
                    <span className="text-ink-soft">{m.role}</span>{" "}
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-ink-soft">({m.affiliation})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer className="mt-16 flex flex-col items-center gap-4 border-t border-line pt-10">
          <Image
            src={assets.logo}
            alt="충청남도청양교육지원청"
            className="h-auto w-[260px]"
          />
          <p className="text-center text-xs leading-relaxed text-ink-faint">
            이미지 디자인 : 충남전문상담교사협의회 회장 유인선
            <br />
            글꼴 : Pretendard (SIL Open Font License 1.1)
           <br /> <br />
            Copyright ⓒ충청남도청양교육지원청. All Rights Reserved.
              
          </p>
        </footer>
      </div>
    </section>
  );
}
