// Copies the on-device OCR runtime next to the traineddata file.
// The photo is read in the browser from these same-origin files.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "tesseract");
mkdirSync(dest, { recursive: true });

const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm", "tesseract-core-simd-lstm.wasm"],
];

for (const [from, name] of files) {
  const source = join(root, from);
  if (!existsSync(source)) {
    console.error(`Missing ${from}. Install dependencies before building.`);
    process.exit(1);
  }
  copyFileSync(source, join(dest, name));
}

if (!existsSync(join(dest, "eng.traineddata.gz"))) {
  console.error("Missing public/tesseract/eng.traineddata.gz");
  process.exit(1);
}

console.log("On-device OCR files are in public/tesseract");
