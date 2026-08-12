/**
 * 배경에 천천히 흩날리는 민들레 씨앗 장식.
 * 화면 낭독기에는 읽히지 않도록 aria-hidden 처리했고,
 * '동작 줄이기'를 켠 사용자에게는 globals.css 의 설정으로 자동 정지합니다.
 */
/** 서버·브라우저가 같은 문자열을 쓰도록 좌표를 반올림합니다 (hydration 불일치 방지) */
const round2 = (n: number) => Math.round(n * 100) / 100;

const SEEDS = [
  { left: "18%", top: "62%", delay: "0s", duration: "17s", scale: 0.9 },
  { left: "34%", top: "48%", delay: "2.5s", duration: "21s", scale: 0.65 },
  { left: "47%", top: "70%", delay: "6s", duration: "19s", scale: 1 },
  { left: "62%", top: "40%", delay: "9s", duration: "23s", scale: 0.75 },
  { left: "76%", top: "58%", delay: "4s", duration: "18s", scale: 0.55 },
];

export function DandelionSeeds() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {SEEDS.map((seed, i) => (
        <span
          key={i}
          className="absolute animate-seed-drift"
          style={{
            left: seed.left,
            top: seed.top,
            animationDelay: seed.delay,
            animationDuration: seed.duration,
          }}
        >
          <svg
            width={22 * seed.scale}
            height={22 * seed.scale}
            viewBox="0 0 24 24"
            fill="none"
            className="opacity-70"
          >
            {/* 씨앗 갓털 */}
            {Array.from({ length: 8 }).map((_, n) => {
              const angle = (n * Math.PI) / 4;
              return (
                <line
                  key={n}
                  x1="12"
                  y1="9"
                  x2={round2(12 + Math.cos(angle) * 7)}
                  y2={round2(9 + Math.sin(angle) * 7)}
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              );
            })}
            <line
              x1="12"
              y1="9"
              x2="12"
              y2="21"
              stroke="#d8c48a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
