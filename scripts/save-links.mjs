/**
 * 구글 시트 '자료링크' 열의 **하이퍼링크 주소**를 public/snapshot/links.json 으로 저장합니다.
 *
 * 왜 필요한가
 * -----------
 * 시트에서 셀에 링크를 걸면(글자에 링크 삽입) 화면에는 '학생생활자료실' 같은 글자만 보입니다.
 * 이때 CSV·TSV·JSON 어떤 형식으로 내보내도 **주소가 빠지고 표시 글자만** 나옵니다.
 * (2026-08-13 확인: gviz out:csv / out:html / out:json, export?format=tsv 모두 주소 없음)
 * 반면 **엑셀(xlsx) 내보내기에는 주소가 그대로 들어 있습니다.**
 *
 * 그래서 배포할 때마다 xlsx 를 한 번 받아 링크만 뽑아 두고,
 * 실행 중에는 실시간 CSV + 이 파일을 합쳐 씁니다. (lib/sheets.ts)
 *
 * 수동 실행: npm run sync:links
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const SHEET_ID = "1HdOONWEalo5s6EY2yPjMuAY9f8G-EtulPuf0_0tmJsU";

// lib/config.ts 의 TOPICS 와 같아야 합니다.
const TOPICS = [
  { key: "crisis", sheetName: "위기(자해 및 자살시도)" },
  { key: "violence", sheetName: "폭력피해(학대 및 학교폭력)" },
  { key: "aftercare", sheetName: "사후안정화(사안발생후)" },
  { key: "cne", sheetName: "충청남도교육청 개발자료" },
];

/* ------------------------------------------------------------------
   1. zip 풀기 (xlsx 는 zip 파일입니다)

   외부 라이브러리를 쓰지 않으려고 최소한의 zip 판독기를 직접 둡니다.
   구글이 내보내는 xlsx 는 항목 수백 개짜리 단순 zip 이라 이 정도면 충분합니다.
------------------------------------------------------------------- */

function unzip(buf) {
  // 끝에서부터 중앙 디렉터리 종료 표식(EOCD)을 찾습니다.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66_000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("zip 형식이 아닙니다 (EOCD 없음)");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);

    // 실제 데이터 위치는 지역 헤더의 이름·부가정보 길이를 넘긴 곳입니다.
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    files.set(name, method === 0 ? raw : inflateRawSync(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/* ------------------------------------------------------------------
   2. xlsx 안의 XML 읽기
------------------------------------------------------------------- */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (m, code) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code] ?? m;
  });
}

const text = (files, name) => files.get(name)?.toString("utf8") ?? "";

/** 공유 문자열 표. 셀에 t="s" 가 붙으면 값은 이 표의 번호입니다. */
function readSharedStrings(files) {
  const xml = text(files, "xl/sharedStrings.xml");
  const out = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    // 서식이 섞인 셀은 <r><t>조각</t></r> 여러 개로 쪼개져 있어 모두 이어 붙입니다.
    let s = "";
    for (const t of si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) s += decodeXml(t[1]);
    out.push(s);
  }
  return out;
}

/** 시트 이름 → 시트 XML 경로 */
function readSheetPaths(files) {
  const wb = text(files, "xl/workbook.xml");
  const rels = text(files, "xl/_rels/workbook.xml.rels");

  const target = new Map();
  for (const r of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(r[0])?.[1];
    const t = /Target="([^"]+)"/.exec(r[0])?.[1];
    if (id && t) target.set(id, decodeXml(t).replace(/^\/?xl\//, ""));
  }

  const paths = new Map();
  for (const s of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(s[0])?.[1];
    const rid = /r:id="([^"]+)"/.exec(s[0])?.[1];
    if (name && rid && target.has(rid)) {
      paths.set(decodeXml(name), `xl/${target.get(rid)}`);
    }
  }
  return paths;
}

/** "J12" → { col: 9, row: 12 } */
function parseRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: Number(m[2]) };
}

/** 시트 한 장 → { rows: string[][], links: Map<"행,열", 주소> } */
function readSheet(files, sheetPath, shared) {
  const xml = text(files, sheetPath);
  const rows = [];

  // 값이 없는 행·칸은 <row .../> <c .../> 처럼 자기 완결 태그로 나옵니다.
  // 속성 부분을 최소 일치(*?)로 잡아야 그 뒤의 행·칸을 삼키지 않습니다.
  for (const rowXml of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNo = Number(/\br="(\d+)"/.exec(rowXml[1])?.[1] ?? 0);
    const cells = [];
    for (const c of (rowXml[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const body = c[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const pos = ref ? parseRef(ref) : null;
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
      let value = "";

      if (type === "inlineStr") {
        for (const t of body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) value += decodeXml(t[1]);
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        if (v != null) value = type === "s" ? (shared[Number(v)] ?? "") : decodeXml(v);
      }
      if (pos) cells[pos.col] = value;
    }
    rows[rowNo - 1] = cells;
  }

  // 하이퍼링크는 셀이 아니라 시트 끝에 따로 모여 있고, 실제 주소는 rels 파일에 있습니다.
  const relsPath = sheetPath.replace(/([^/]+)$/, "_rels/$1.rels");
  const relTarget = new Map();
  for (const r of text(files, relsPath).matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(r[0])?.[1];
    const t = /Target="([^"]+)"/.exec(r[0])?.[1];
    if (id && t) relTarget.set(id, decodeXml(t));
  }

  const links = new Map();
  for (const h of xml.matchAll(/<hyperlink\b[^>]*>/g)) {
    const ref = /\bref="([A-Z]+\d+)/.exec(h[0])?.[1]; // 범위면 왼쪽 위 칸
    const rid = /r:id="([^"]+)"/.exec(h[0])?.[1];
    const pos = ref ? parseRef(ref) : null;
    const url = rid ? relTarget.get(rid) : null;
    if (pos && url) links.set(`${pos.row},${pos.col}`, url);
  }

  return { rows, links };
}

/* ------------------------------------------------------------------
   3. 열 찾기 — lib/sheets.ts 와 같은 규칙(공백 제거 후 비교)
------------------------------------------------------------------- */

const squash = (s) => (s ?? "").replace(/\s+/g, "");

/**
 * 연번 정규화. 엑셀은 숫자 칸을 "25.0" 처럼 적어 두기도 하는데,
 * CSV 쪽은 "25" 로 오므로 맞춰 둬야 연계자료 연번이 서로 이어집니다.
 * "26-1" 같은 문자열은 그대로 둡니다.
 */
function normalizeNo(value) {
  const v = (value ?? "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(v)) return v;
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : v;
}

function findColumn(header, label) {
  const want = squash(label);
  const squashed = header.map(squash);
  let i = squashed.indexOf(want);
  if (i === -1) i = squashed.findIndex((h) => h.startsWith(want));
  return i;
}

/* ------------------------------------------------------------------
   4. 실행
------------------------------------------------------------------- */

const res = await fetch(
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`,
);
if (!res.ok) throw new Error(`엑셀 내보내기 실패: ${res.status} ${res.statusText}`);

const files = unzip(Buffer.from(await res.arrayBuffer()));
const shared = readSharedStrings(files);
const sheetPaths = readSheetPaths(files);

const topics = {};
let total = 0;
let linked = 0;
const missing = [];

for (const topic of TOPICS) {
  const sheetPath = sheetPaths.get(topic.sheetName);
  if (!sheetPath) {
    console.error(`✗ 탭을 찾지 못했습니다: ${topic.sheetName}`);
    continue;
  }

  const { rows, links } = readSheet(files, sheetPath, shared);
  const header = rows[0] ?? [];
  const cNo = findColumn(header, "연번");
  const cTitle = findColumn(header, "자료명");
  const cLink = findColumn(header, "자료링크");

  if (cTitle === -1 || cLink === -1) {
    console.error(`✗ ${topic.sheetName}: '자료명' 또는 '자료링크' 열을 찾지 못했습니다`);
    continue;
  }

  const list = [];
  // i = '자료명이 있는 행' 중 몇 번째인지. 실행 중 CSV 를 읽을 때도 같은 기준으로 셉니다.
  let i = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const title = (row[cTitle] ?? "").trim();
    if (!title) continue; // 작성 중인 빈 행 — 사이트에 노출되지 않는 행

    const url = links.get(`${r + 1},${cLink}`) ?? "";
    const label = (row[cLink] ?? "").trim();
    total++;

    if (url) linked++;
    else if (!/^https?:\/\//i.test(label)) {
      missing.push(`${topic.key} #${i} ${title.slice(0, 24)}`);
    }

    list.push({
      i,
      no: cNo === -1 ? "" : normalizeNo(row[cNo]),
      title,
      label,
      // 셀에 링크가 걸려 있으면 그 주소, 없으면 글자가 주소인 경우를 그대로 씁니다.
      url: url || (/^https?:\/\//i.test(label) ? label : ""),
    });
    i++;
  }

  topics[topic.key] = list;
  const withUrl = list.filter((x) => x.url).length;
  console.log(`✓ ${topic.sheetName} → ${list.length}건 중 ${withUrl}건 링크 확보`);
}

const dest = path.resolve(import.meta.dirname, "..", "public", "snapshot");
await mkdir(dest, { recursive: true });
await writeFile(
  path.join(dest, "links.json"),
  JSON.stringify({ fetchedAt: new Date().toISOString(), topics }, null, 0),
  "utf8",
);

console.log(`\n전체 ${total}건 · 셀 링크 ${linked}건`);
if (missing.length > 0) {
  console.warn(`주소를 찾지 못한 자료 ${missing.length}건:`);
  for (const m of missing.slice(0, 20)) console.warn(`  - ${m}`);
}
