/**
 * 구글 시트 4개 탭을 public/snapshot/*.csv 로 내려받아 둡니다.
 *
 * 이 파일들은 구글이 응답하지 않을 때만 쓰이는 **예비 사본**입니다.
 * (평소에는 항상 시트를 실시간으로 읽습니다)
 * 배포할 때마다 자동으로 갱신되며, 수동 실행은 `npm run sync:snapshot`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SHEET_ID = "1HdOONWEalo5s6EY2yPjMuAY9f8G-EtulPuf0_0tmJsU";

// lib/config.ts 의 TOPICS 와 같아야 합니다.
const TOPICS = [
  { key: "crisis", sheetName: "위기(자해 및 자살시도)" },
  { key: "violence", sheetName: "폭력피해(학대 및 학교폭력)" },
  { key: "aftercare", sheetName: "사후안정화(사안발생후)" },
  { key: "cne", sheetName: "충청남도교육청 개발자료" },
];

const dest = path.resolve(import.meta.dirname, "..", "public", "snapshot");
await mkdir(dest, { recursive: true });

let failed = 0;
for (const topic of TOPICS) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(topic.sheetName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const csv = await res.text();
    await writeFile(path.join(dest, `${topic.key}.csv`), csv, "utf8");
    const rows = csv.split("\n").length;
    console.log(`✓ ${topic.sheetName} → ${topic.key}.csv (${rows}줄)`);
  } catch (e) {
    failed++;
    console.error(`✗ ${topic.sheetName}: ${e.message}`);
  }
}

// 예비 사본을 못 받아도 배포 자체는 계속 진행합니다.
if (failed > 0) console.warn(`\n${failed}개 탭을 내려받지 못했습니다.`);
