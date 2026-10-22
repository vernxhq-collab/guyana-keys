export const KEYS_DOCUMENT_KINDS = ["id_front", "id_back", "licence", "selfie_with_id", "code_selfie", "code_video"] as const;
export type KeysDocumentKind = (typeof KEYS_DOCUMENT_KINDS)[number];

export const ID_KINDS = ["national_id", "passport", "drivers_licence"] as const;
export type IdKind = (typeof ID_KINDS)[number];

export const VERIFICATION_PROVIDERS = ["manual", "future_inhouse_auto", "future_eid_registry"] as const;
export type VerificationProviderId = (typeof VERIFICATION_PROVIDERS)[number];

/** Who the check is about. The same provider and the same table serve every role. */
export const SUBJECT_TYPES = ["agent", "tenant", "purchaser", "landlord"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export function isSubjectType(value: string): value is SubjectType {
  return (SUBJECT_TYPES as readonly string[]).includes(value);
}

export function subjectLabel(value: string) {
  if (value === "agent") return "Agent";
  if (value === "tenant") return "Tenant";
  if (value === "purchaser") return "Purchaser";
  if (value === "landlord") return "Landlord";
  return "";
}

/**
 * The only provider this phase runs. It does not change with the subject.
 * A later open-source reader (document OCR or MRZ) would be a second object
 * with id "future_inhouse_auto" and a readDocument method.
 * A Guyana Digital Identity Card registry lookup would be id "future_eid_registry".
 * Neither method exists here. There is no face-match function.
 */
export type VerificationProvider = {
  id: VerificationProviderId;
  review: "human";
  subjectType: SubjectType;
};

export function verificationProvider(subjectType: SubjectType = "agent"): VerificationProvider {
  return { id: "manual", review: "human", subjectType };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_MINUTES = 30;

export function makeCheckCode(draw: (max: number) => number = (max) => Math.floor(Math.random() * max)) {
  let code = "";
  for (let i = 0; i < 6; i += 1) code += CODE_ALPHABET[draw(CODE_ALPHABET.length)] || "A";
  return code;
}

export function codeStillCurrent(issuedAt: string, now = Date.now()) {
  const issued = new Date(issuedAt).getTime();
  if (!Number.isFinite(issued)) return false;
  return now - issued < CODE_MINUTES * 60 * 1000 && now >= issued;
}

export function documentLabel(kind: string) {
  if (kind === "id_front") return "ID front";
  if (kind === "id_back") return "ID back";
  if (kind === "licence") return "Licence";
  if (kind === "selfie_with_id") return "Selfie with ID";
  if (kind === "code_selfie") return "Code photo";
  if (kind === "code_video") return "Code clip";
  if (kind === "id_scan") return "Older ID file";
  if (kind === "selfie") return "Older photo";
  return "File";
}

export function idKindLabel(kind: string) {
  if (kind === "national_id") return "National ID";
  if (kind === "passport") return "Passport";
  if (kind === "drivers_licence") return "Driver's licence";
  return "";
}

export function imageQuality(input: { width: number; height: number; sampleWidth: number; sampleHeight: number; luminance: number[] }) {
  const warnings: string[] = [];
  if (input.width < 1000 || input.height < 700) warnings.push("This photo is small. A reviewer may not be able to read the document.");
  const count = input.luminance.length;
  if (!count || input.sampleWidth < 2 || input.sampleHeight < 2) {
    warnings.push("This photo could not be read in the browser.");
    return warnings;
  }
  const bright = input.luminance.filter((value) => value >= 250).length / count;
  if (bright > 0.2) warnings.push("A lot of this photo is very bright. Glare can hide the text.");
  if (laplacianVariance(input.luminance, input.sampleWidth, input.sampleHeight) < 15) {
    warnings.push("This photo looks soft. Hold the camera still and move closer if the text is hard to read.");
  }
  return warnings;
}

export function laplacianVariance(luminance: number[], width: number, height: number) {
  const values: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const lap = (4 * luminance[index]) - luminance[index - 1] - luminance[index + 1] - luminance[index - width] - luminance[index + width];
      values.push(lap);
    }
  }
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
}

export function cleanQualityNote(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/certified|verified|accurate|guarantee|pass|match|liveness/i.test(line))
    .join(" ")
    .slice(0, 400);
}

export function flagSentence(flag: string) {
  if (flag === "duplicate_file") return "This file matches a file already stored on another account.";
  if (flag === "duplicate_id_number") return "This ID number is already stored on another account.";
  return "";
}
