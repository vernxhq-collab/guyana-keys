import { readMrz, type MrzRead } from "./mrz-read";

export type DocumentRead = { text: string; mrz: MrzRead; readFailed: boolean };

const FAILED: DocumentRead = { text: "", mrz: { name: "", number: "", expiry: "", checksum: "none" }, readFailed: true };

/**
 * Reads words on a photo in the browser. The worker, the model, and the photo
 * stay on this site. Nothing is uploaded for reading.
 */
export async function readDocument(image: Blob): Promise<DocumentRead> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
      langPath: "/tesseract",
      gzip: true,
      workerBlobURL: false,
    });
    try {
      const result = await worker.recognize(image);
      const text = result.data?.text || "";
      if (!text.trim()) return FAILED;
      return { text, mrz: readMrz(text), readFailed: false };
    } finally {
      await worker.terminate();
    }
  } catch {
    return FAILED;
  }
}
