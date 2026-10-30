/** Server-side checks on an uploaded identity file. Pure functions, apart from the image re-encode. */

export type SniffedType = "jpeg" | "png" | "pdf" | "webp" | "heic" | "";

export const UPLOAD_MAX_BYTES = 10_000_000;
export const IMAGE_MAX_EDGE = 2000;

/** Reads the first bytes. The declared content type is not trusted. */
export function sniffType(bytes: Uint8Array): SniffedType {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "png";
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) return "pdf";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp" && ["heic", "heix", "mif1", "msf1", "hevc"].includes(ascii(bytes, 8, 12))) return "heic";
  return "";
}

function ascii(bytes: Uint8Array, from: number, to: number) {
  let out = "";
  for (let index = from; index < to; index += 1) out += String.fromCharCode(bytes[index]);
  return out;
}

/** The only content types the browser may declare when it asks for an upload URL. */
export const DECLARED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export type DeclaredType = (typeof DECLARED_TYPES)[number];

export function declaredMatches(declared: string, sniffed: SniffedType) {
  if (declared === "image/jpeg") return sniffed === "jpeg";
  if (declared === "image/png") return sniffed === "png";
  if (declared === "application/pdf") return sniffed === "pdf";
  return false;
}

/** A PDF is stored as uploaded after the magic-byte check. Reject one with script or auto-actions. */
export function pdfLooksActive(bytes: Uint8Array) {
  const sample = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 2_000_000))).toString("latin1");
  return /\/(JavaScript|JS|OpenAction|AA|Launch|EmbeddedFile|RichMedia)\b/.test(sample);
}

/**
 * Re-encodes an image as a fresh JPEG: decodes it fully, applies the EXIF rotation,
 * drops all metadata (GPS and camera fields), and caps the long edge.
 */
export async function reencodeImage(bytes: Buffer) {
  const sharp = (await import("sharp")).default;
  const out = await sharp(bytes, { limitInputPixels: 60_000_000, failOn: "error" })
    .rotate()
    .resize({ width: IMAGE_MAX_EDGE, height: IMAGE_MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return out;
}
