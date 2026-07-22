import { bytesEqual, startsWithAscii, startsWithBytes, uniqueBy } from "./binary";
import { analyzeJpeg, cleanJpegBytes } from "./jpeg";
import { analyzePng, cleanPngBytes } from "./png";
import { analyzeWebP, cleanWebPBytes } from "./webp";
import {
  METADATA_CATEGORIES,
  MetadataCleanerError,
  type MetadataCategory,
  type MetadataCleanResult,
  type MetadataFinding,
  type MetadataInspection,
  type MetadataPreservationCapabilities,
  type ProvenanceIndicator,
  type SupportedMetadataFormat,
} from "./types";

export type {
  MetadataCategory,
  MetadataCleanerErrorCode,
  MetadataCleanPreservationReport,
  MetadataCleanReport,
  MetadataCleanResult,
  MetadataFinding,
  MetadataInspection,
  MetadataPreservationCapabilities,
  MetadataSource,
  ProvenanceIndicator,
  ProvenanceKind,
  SupportedMetadataFormat,
} from "./types";
export { METADATA_CATEGORIES, MetadataCleanerError } from "./types";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

const FORMAT_MIMES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

const PRESERVATION_CAPABILITIES: MetadataPreservationCapabilities = {
  pixelPayload: "preserved",
  colorProfile: "preserved-when-present",
  orientation: "preserved-when-present",
  density: "preserved-when-present",
  alpha: "preserved-when-present",
  provenance: "bytes-preserved-validity-not-guaranteed",
};

interface FormatAnalysis {
  readonly fields: readonly MetadataFinding[];
  readonly provenance: readonly ProvenanceIndicator[];
  readonly colorProfileFingerprint: string;
  readonly orientationFingerprint: string;
  readonly densityFingerprint: string;
  readonly alphaFingerprint: string;
}

export function detectMetadataFormat(bytes: Uint8Array): SupportedMetadataFormat {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "jpeg";
  }
  if (startsWithBytes(bytes, PNG_SIGNATURE)) {
    return "png";
  }
  if (bytes.length >= 12 && startsWithAscii(bytes, "RIFF") && startsWithAscii(bytes, "WEBP", 8)) {
    return "webp";
  }
  throw new MetadataCleanerError(
    "UNSUPPORTED_FORMAT",
    "지원되는 JPEG, PNG 또는 WebP 파일 서명을 찾지 못했습니다.",
  );
}

function analyze(bytes: Uint8Array, format: SupportedMetadataFormat): FormatAnalysis {
  if (format === "jpeg") return analyzeJpeg(bytes);
  if (format === "png") return analyzePng(bytes);
  return analyzeWebP(bytes);
}

function normalizedMimeMatches(mime: string, format: SupportedMetadataFormat): boolean {
  const normalized = mime.trim().toLowerCase().split(";", 1)[0];
  if (!normalized || normalized === "application/octet-stream") return true;
  if (format === "jpeg") return normalized === "image/jpeg" || normalized === "image/jpg";
  return normalized === FORMAT_MIMES[format];
}

function sortedCategories(fields: readonly MetadataFinding[]): MetadataCategory[] {
  const present = new Set(fields.map((field) => field.category));
  return METADATA_CATEGORIES.filter((category) => present.has(category));
}

export function inspectMetadata(bytes: Uint8Array, mime: string): MetadataInspection {
  const format = detectMetadataFormat(bytes);
  const analysis = analyze(bytes, format);
  return {
    format,
    detectedMime: FORMAT_MIMES[format],
    suppliedMime: mime,
    mimeMatchesSignature: normalizedMimeMatches(mime, format),
    fields: analysis.fields,
    categories: sortedCategories(analysis.fields),
    provenance: analysis.provenance,
    hasProvenance: analysis.provenance.length > 0,
    losslessCleaningSupported: true,
    preservation: PRESERVATION_CAPABILITIES,
  };
}
function validateCategories(categories: readonly MetadataCategory[]): MetadataCategory[] {
  const allowed = new Set<string>(METADATA_CATEGORIES);
  for (const category of categories as readonly string[]) {
    if (!allowed.has(category)) {
      throw new MetadataCleanerError(
        "INVALID_CATEGORY",
        `제거할 수 없는 메타데이터 범주입니다: ${category}`,
      );
    }
  }
  return uniqueBy(categories, (category) => category);
}

function findingKey(field: MetadataFinding): string {
  return `${field.source}\0${field.category}\0${field.label}\0${field.value ?? ""}`;
}

function subtractFindings(
  before: readonly MetadataFinding[],
  after: readonly MetadataFinding[],
  selected: ReadonlySet<MetadataCategory>,
): MetadataFinding[] {
  const remainingCounts = new Map<string, number>();
  for (const field of after) {
    const key = findingKey(field);
    remainingCounts.set(key, (remainingCounts.get(key) ?? 0) + 1);
  }
  const removed: MetadataFinding[] = [];
  for (const field of before) {
    if (!selected.has(field.category)) continue;
    const key = findingKey(field);
    const count = remainingCounts.get(key) ?? 0;
    if (count > 0) {
      remainingCounts.set(key, count - 1);
    } else {
      removed.push(field);
    }
  }
  return removed;
}

function provenanceKindsPreserved(
  before: readonly ProvenanceIndicator[],
  after: readonly ProvenanceIndicator[],
): boolean {
  const counts = new Map<string, number>();
  for (const indicator of after) {
    counts.set(indicator.kind, (counts.get(indicator.kind) ?? 0) + 1);
  }
  for (const indicator of before) {
    const count = counts.get(indicator.kind) ?? 0;
    if (count === 0) return false;
    counts.set(indicator.kind, count - 1);
  }
  return true;
}

export function cleanMetadata(
  bytes: Uint8Array,
  mime: string,
  selectedCategories: readonly MetadataCategory[],
): MetadataCleanResult {
  const format = detectMetadataFormat(bytes);
  const selectedList = validateCategories(selectedCategories);
  const selected = new Set(selectedList);
  const before = analyze(bytes, format);

  const cleaned = format === "jpeg"
    ? cleanJpegBytes(bytes, selected)
    : format === "png"
      ? cleanPngBytes(bytes, selected)
      : cleanWebPBytes(bytes, selected);
  const after = analyze(cleaned.bytes, format);
  const changed = !bytesEqual(bytes, cleaned.bytes);
  const beforeCategories = new Set(before.fields.map((field) => field.category));
  const afterCategories = new Set(after.fields.map((field) => field.category));
  const removedCategories = selectedList.filter(
    (category) => beforeCategories.has(category) && !afterCategories.has(category),
  );
  const remainingSelectedCategories = selectedList.filter((category) => afterCategories.has(category));
  const remainingFields = after.fields.filter((field) => selected.has(field.category));
  const warnings = [...cleaned.warnings];

  if (!normalizedMimeMatches(mime, format)) {
    warnings.push(`파일의 실제 형식은 ${FORMAT_MIMES[format]}이며 전달된 MIME 형식과 다릅니다.`);
  }
  if (changed && before.provenance.length > 0) {
    warnings.push("파일 바이트가 변경되어 포함된 콘텐츠 자격 증명이 더 이상 유효하지 않을 수 있습니다.");
  }
  if (remainingSelectedCategories.length > 0) {
    warnings.push("출처 정보 보호 또는 안전한 부분 수정의 한계로 일부 선택 항목이 남아 있습니다.");
  }

  return {
    bytes: cleaned.bytes,
    report: {
      format,
      changed,
      inputBytes: bytes.length,
      outputBytes: cleaned.bytes.length,
      selectedCategories: selectedList,
      removedCategories,
      remainingSelectedCategories,
      removedFields: subtractFindings(before.fields, after.fields, selected),
      remainingFields,
      provenance: before.provenance,
      provenanceMayBeInvalidated: changed && before.provenance.length > 0,
      preservation: {
        pixelPayloadPreserved: true,
        reencoded: false,
        qualityChangeExpected: false,
        colorProfilePreserved:
          before.colorProfileFingerprint === after.colorProfileFingerprint,
        orientationPreserved:
          before.orientationFingerprint === after.orientationFingerprint,
        densityPreserved: before.densityFingerprint === after.densityFingerprint,
        alphaPreserved: before.alphaFingerprint === after.alphaFingerprint,
        provenanceBytesPreserved: provenanceKindsPreserved(before.provenance, after.provenance),
      },
      warnings: uniqueBy(warnings, (warning) => warning),
    },
  };
}
