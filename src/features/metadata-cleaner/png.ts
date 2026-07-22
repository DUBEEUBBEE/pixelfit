import {
  ascii,
  concatBytes,
  fingerprintBytes,
  malformed,
  readUint32BE,
  startsWithBytes,
  uniqueBy,
  utf8,
  writeUint32BE,
} from "./binary";
import { cleanExif, inspectExif } from "./exif";
import { detectProvenance, isProtectedProvenanceContainer } from "./provenance";
import { categorizeTextKeyword, cleanXmp, inspectXmp, textFinding } from "./textual";
import type {
  MetadataCategory,
  MetadataFinding,
  ProvenanceIndicator,
} from "./types";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

interface PngChunk {
  readonly type: string;
  readonly start: number;
  readonly dataStart: number;
  readonly dataEnd: number;
  readonly end: number;
}

interface InternationalText {
  readonly keyword: string;
  readonly compressed: boolean;
  readonly textStart: number;
}

export interface PngAnalysis {
  readonly fields: readonly MetadataFinding[];
  readonly provenance: readonly ProvenanceIndicator[];
  readonly colorProfileFingerprint: string;
  readonly orientationFingerprint: string;
  readonly densityFingerprint: string;
  readonly alphaFingerprint: string;
}

function parsePng(bytes: Uint8Array): PngChunk[] {
  if (!startsWithBytes(bytes, PNG_SIGNATURE)) {
    malformed("The file does not have a valid PNG signature.");
  }
  const chunks: PngChunk[] = [];
  let offset: number = PNG_SIGNATURE.length;
  let sawEnd = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) {
      malformed("Truncated PNG chunk.");
    }
    const length = readUint32BE(bytes, offset);
    const type = ascii(bytes, offset + 4, 4);
    if (!/^[A-Za-z]{4}$/.test(type) || length > bytes.length - offset - 12) {
      malformed("Invalid PNG chunk length or type.");
    }
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const end = dataEnd + 4;
    chunks.push({ type, start: offset, dataStart, dataEnd, end });
    offset = end;
    if (type === "IEND") {
      sawEnd = true;
      if (offset !== bytes.length) {
        malformed("Unexpected bytes after the PNG IEND chunk.");
      }
      break;
    }
    if (chunks.length > 100_000) {
      malformed("PNG contains too many chunks.");
    }
  }
  if (!sawEnd || chunks[0]?.type !== "IHDR") {
    malformed("PNG is missing IHDR or IEND.");
  }
  return chunks;
}

function findZero(bytes: Uint8Array, start: number): number {
  for (let offset = start; offset < bytes.length; offset += 1) {
    if (bytes[offset] === 0) return offset;
  }
  return -1;
}

function parseInternationalText(data: Uint8Array): InternationalText | undefined {
  const keywordEnd = findZero(data, 0);
  if (keywordEnd < 1 || keywordEnd > 79 || keywordEnd + 3 > data.length) return undefined;
  const compressed = data[keywordEnd + 1] === 1;
  let offset = keywordEnd + 3;
  const languageEnd = findZero(data, offset);
  if (languageEnd < 0) return undefined;
  offset = languageEnd + 1;
  const translatedEnd = findZero(data, offset);
  if (translatedEnd < 0) return undefined;
  return {
    keyword: ascii(data, 0, keywordEnd),
    compressed,
    textStart: translatedEnd + 1,
  };
}

function isXmpKeyword(keyword: string): boolean {
  const normalized = keyword.toLowerCase();
  return normalized.includes("adobe.xmp") || normalized.includes("raw profile type xmp");
}

function pngChunkProvenance(
  data: Uint8Array,
  chunk: PngChunk,
  index: number,
): ProvenanceIndicator[] {
  const structural = chunk.type === "caBX"
    ? (["c2pa", "jumbf"] as const)
    : ["JUMB", "jUMb", "C2PA"].includes(chunk.type)
      ? (["jumbf"] as const)
      : [];
  const shouldInspectData =
    structural.length > 0 || ["iTXt", "tEXt", "zTXt", "eXIf"].includes(chunk.type);
  return detectProvenance(
    shouldInspectData ? data : new Uint8Array(),
    `PNG ${chunk.type} #${index + 1}`,
    structural,
  );
}

function inspectTextChunk(data: Uint8Array, chunk: PngChunk): MetadataFinding[] {
  if (chunk.type === "tEXt" || chunk.type === "zTXt") {
    const keywordEnd = findZero(data, 0);
    if (keywordEnd < 1 || keywordEnd > 79) return [];
    const keyword = ascii(data, 0, keywordEnd);
    const valueStart = keywordEnd + (chunk.type === "zTXt" ? 2 : 1);
    if (valueStart > data.length) return [];
    if (isXmpKeyword(keyword) && chunk.type === "tEXt") {
      return inspectXmp(data.subarray(valueStart));
    }
    const value = chunk.type === "zTXt"
      ? "압축된 텍스트"
      : utf8(data.subarray(valueStart)).replace(/\0/g, "").trim() || undefined;
    return [textFinding(keyword, value, chunk.dataStart)];
  }
  if (chunk.type === "iTXt") {
    const parsed = parseInternationalText(data);
    if (!parsed) return [];
    if (isXmpKeyword(parsed.keyword) && !parsed.compressed) {
      return inspectXmp(data.subarray(parsed.textStart));
    }
    const value = parsed.compressed
      ? "압축된 국제 텍스트"
      : utf8(data.subarray(parsed.textStart)).replace(/\0/g, "").trim() || undefined;
    return [textFinding(parsed.keyword, value, chunk.dataStart)];
  }
  return [];
}

function fingerprint(parts: readonly Uint8Array[]): string {
  return parts.map(fingerprintBytes).join("|");
}

export function analyzePng(bytes: Uint8Array): PngAnalysis {
  const chunks = parsePng(bytes);
  const fields: MetadataFinding[] = [];
  const provenance: ProvenanceIndicator[] = [];
  const profiles: Uint8Array[] = [];
  const densities: Uint8Array[] = [];
  const alpha: Uint8Array[] = [];
  const orientations: string[] = [];

  chunks.forEach((chunk, index) => {
    const data = bytes.subarray(chunk.dataStart, chunk.dataEnd);
    provenance.push(...pngChunkProvenance(data, chunk, index));
    if (["tEXt", "zTXt", "iTXt"].includes(chunk.type)) {
      fields.push(...inspectTextChunk(data, chunk));
    } else if (chunk.type === "eXIf") {
      const exif = inspectExif(data);
      fields.push(...exif.fields);
      if (exif.orientationFingerprint) orientations.push(exif.orientationFingerprint);
      if (exif.densityFingerprint) densities.push(new TextEncoder().encode(exif.densityFingerprint));
    }
    if (chunk.type === "iCCP") profiles.push(data);
    if (chunk.type === "pHYs") densities.push(data);
    if (chunk.type === "tRNS") alpha.push(data);
    if (chunk.type === "IHDR" && data.length === 13 && [4, 6].includes(data[9])) {
      alpha.push(Uint8Array.of(data[9]));
    }
  });
  return {
    fields: uniqueBy(fields, (field) => `${field.source}:${field.category}:${field.label}:${field.value ?? ""}`),
    provenance: uniqueBy(provenance, (indicator) => `${indicator.kind}:${indicator.container}`),
    colorProfileFingerprint: fingerprint(profiles),
    orientationFingerprint: orientations.sort().join("|"),
    densityFingerprint: fingerprint(densities),
    alphaFingerprint: fingerprint(alpha),
  };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const output = new Uint8Array(12 + data.length);
  writeUint32BE(output, 0, data.length);
  output.set(typeBytes, 4);
  output.set(data, 8);
  writeUint32BE(output, 8 + data.length, crc32(concatBytes([typeBytes, data])));
  return output;
}

export function cleanPngBytes(
  bytes: Uint8Array,
  selected: ReadonlySet<MetadataCategory>,
): { bytes: Uint8Array; warnings: string[] } {
  const chunks = parsePng(bytes);
  const output: Uint8Array[] = [bytes.subarray(0, PNG_SIGNATURE.length)];
  const warnings: string[] = [];

  chunks.forEach((chunk, index) => {
    const original = bytes.subarray(chunk.start, chunk.end);
    const data = bytes.subarray(chunk.dataStart, chunk.dataEnd);
    const provenance = pngChunkProvenance(data, chunk, index);
    if (isProtectedProvenanceContainer(provenance)) {
      output.push(original);
      if (selected.size > 0) {
        warnings.push(`PNG ${chunk.type} 청크에 출처 정보가 있어 해당 청크를 변경하지 않았습니다.`);
      }
      return;
    }

    if (chunk.type === "eXIf") {
      const cleaned = cleanExif(data, selected);
      output.push(cleaned.changed ? makeChunk(chunk.type, cleaned.bytes) : original);
      return;
    }
    if (["tEXt", "zTXt", "iTXt"].includes(chunk.type)) {
      const international = chunk.type === "iTXt" ? parseInternationalText(data) : undefined;
      const keywordEnd = chunk.type === "iTXt" ? -1 : findZero(data, 0);
      const keyword = international?.keyword ?? (keywordEnd > 0 ? ascii(data, 0, keywordEnd) : "");
      const xmp = isXmpKeyword(keyword);
      if (xmp && selected.has("xmpIptc")) {
        return;
      }
      if (xmp) {
        if (international?.compressed || chunk.type === "zTXt") {
          if ([...selected].some((category) => category !== "thumbnail")) {
            warnings.push(`압축된 PNG XMP 청크는 선택 항목만 안전하게 비울 수 없어 유지했습니다.`);
          }
          output.push(original);
          return;
        }
        const textStart = international?.textStart ?? keywordEnd + 1;
        const cleaned = cleanXmp(data.subarray(textStart), selected);
        if (cleaned.changed) {
          const replacement = data.slice();
          replacement.set(cleaned.bytes, textStart);
          output.push(makeChunk(chunk.type, replacement));
        } else {
          output.push(original);
        }
        return;
      }
      if (keyword && selected.has(categorizeTextKeyword(keyword))) {
        return;
      }
    }
    output.push(original);
  });
  return { bytes: concatBytes(output), warnings: uniqueBy(warnings, (warning) => warning) };
}

export function pngIdatData(bytes: Uint8Array): Uint8Array {
  const chunks = parsePng(bytes);
  return concatBytes(
    chunks
      .filter((chunk) => chunk.type === "IDAT")
      .map((chunk) => bytes.subarray(chunk.dataStart, chunk.dataEnd)),
  );
}
