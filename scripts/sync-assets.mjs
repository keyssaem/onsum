/**
 * image/ 폴더의 원본 이미지를 WebP 로 변환해 public/images/ 에 넣습니다.
 * 새 이미지를 image/ 에 넣은 뒤 `npm run sync:assets` 를 실행하세요.
 *
 * image/         = 디자인 원본 보관 (건드리지 않음)
 * assets/images/ = 빌드에 들어가는 변환본 (.webp)
 *
 * public/ 이 아니라 assets/ 에 두는 이유: public/ 에 넣으면 파일이 그대로 복사되는데,
 * 우리는 정적 import 로 쓰기 때문에 빌드가 사본을 따로 만듭니다. 결국 같은 이미지가
 * 배포물에 두 번 들어갑니다.
 *
 * WebP 로 바꾸는 이유: 배경 일러스트가 원본 그대로면 2MB가 넘어 첫 화면이 느립니다.
 * 눈으로 구분되지 않는 품질로 10분의 1 이하까지 줄어듭니다.
 */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "image");
const dest = path.join(root, "assets", "images");

/** 너무 큰 이미지는 이 너비로 줄입니다 (화면에서 이보다 크게 쓸 일이 없음) */
const MAX_WIDTH = 2000;
const QUALITY = 82;

if (!existsSync(src)) {
  console.error("image/ 폴더가 없습니다.");
  process.exit(1);
}

await mkdir(dest, { recursive: true });

const files = (await readdir(src)).filter((f) =>
  /\.(jpe?g|png|webp)$/i.test(f),
);

let before = 0;
let after = 0;

for (const file of files) {
  const from = path.join(src, file);
  const name = file.replace(/\.[^.]+$/, "") + ".webp";
  const to = path.join(dest, name);

  const image = sharp(from);
  const meta = await image.metadata();
  const resized =
    meta.width && meta.width > MAX_WIDTH ? image.resize({ width: MAX_WIDTH }) : image;

  const buffer = await resized.webp({ quality: QUALITY }).toBuffer();
  await writeFile(to, buffer);

  const originalSize = (await stat(from)).size;
  before += originalSize;
  after += buffer.length;

  const kb = (n) => `${Math.round(n / 1024)}KB`;
  console.log(
    `${file} → ${name}  ${kb(originalSize)} → ${kb(buffer.length)}` +
      (meta.width > MAX_WIDTH ? `  (${meta.width}px → ${MAX_WIDTH}px)` : ""),
  );
}

const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`\n합계 ${mb(before)}MB → ${mb(after)}MB  (assets/images/)`);
