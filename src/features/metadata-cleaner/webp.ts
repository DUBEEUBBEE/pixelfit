import {
  ascii,
  concatBytes,
  fingerprintBytes,
  malformed,
  readUint32LE,
  startsWithAscii,
  uniqueBy,
  writeUint32LE,
} from "./binary";
import { cleanExif, inspectExif } from "./exif";
import { detectProvenance, isProtectedProvenanceContainer } from "./provenance";
import { cleanIptc, cleanXmp, inspectIptc, inspectXmp } from "./textual";
import type {
  MetadataCategory,
  MetadataFinding,
  ProvenanceIndicator,
} from "./types";

interface WebPChunk {
  readonly type: string;
  readonly start: number;
  readonly dataStart: number;
  readonly dataEnd: number;
  readonly end: number;
}

interface OutputChunk {
  readonly type: string;
  readonly bytes: Uint8Array;
}

export interface WebPAnalysis {
  readonly fields: readonly MetadataFinding[];
  readonly provenance: readonly ProvenanceIndicator[];
  readonly colorProfileFingerprint: string;
  readonly orientationFingerprint: string;
  readonly densityFingerprint: string;
  readonly alphaFingerprint: string;
}

function parseWebP(bytes: Uint8Array): WebPChunk[] {
  if (
    bytes.length < 20 ||
    !startsWithAscii(bytes, "RIFF") ||
    !startsWithAscii(bytes, "WEBP", 8)
  ) {
    malformed("The file does not have a valid WebP RIFF signature.");
  }
  const riffSize = readUint32LE(bytes, 4);
  const expectedEnd = riffSize + 8;
  if (expectedEnd !== bytes.length) {
    malformed("The WebP RIFF size does not match the file length.");
  }
  const chunks: WebPChunk[] = [];
  let offset = 12;
  while (offset < expectedEnd) {
    if (offset + 8 > expectedEnd) {
      malformed("Truncated WebP chunk header.");
    }
    const type = ascii(bytes, offset, 4);
    const length = readUint32LE(bytes, offset + 4);
    const dataStart = offset + 8;
    if (length > expectedEnd - dataStart) {
      malformed("Invalid WebP chunk length.");
    }
    const dataEnd = dataStart + length;
    const end = dataEnd + (length & 1);
    if (end > expectedEnd) {
      malformed("Truncated WebP chunk padding.");
    }
    chunks.push({ type, start: offset, dataStart, dataEnd, end });
    offset = end;
    if (chunks.length > 100_000) {
      malformed("WebP contains too many chunks.");
    }
  }
  if (chunks.length === 0) {
    malformed("WebP does not contain an image chunk.");
  }
  return chunks;
}

function chunkProvenance(data: Uint8Array, chunk: WebPChunk, index: number): ProvenanceIndicator[] {
  const structural = chunk.type === "C2PA"
    ? (["c2pa", "jumbf"] as const)
    : chunk.type === "JUMB"
      ? (["jumbf"] as const)
      : [];
  const shouldInspectData = structural.length > 0 || ["XMP ", "EXIF", "IPTC"].includes(chunk.type);
  return detectProvenance(
    shouldInspectData ? data : new Uint8Array(),
    `WebP ${chunk.type.trim() || chunk.type} #${index + 1}`,
    structural,
  );
}

function fingerprint(parts: readonly Uint8Array[]): string {
  return parts.map(fingerprintBytes).join("|");
}

export function analyzeWebP(bytes: Uint8Array): WebPAnalysis {
  const chunks = parseWebP(bytes);
  const fields: MetadataFinding[] = [];
  const provenance: ProvenanceIndicator[] = [];
  const profiles: Uint8Array[] = [];
  const alpha: Uint8Array[] = [];
  const orientations: string[] = [];
  const densities: string[] = [];

  chunks.forEach((chunk, index) => {
    const data = bytes.subarray(chunk.dataStart, chunk.dataEnd);
    provenance.push(...chunkProvenance(data, chunk, index));
    if (chunk.type === "EXIF") {
      const exif = inspectExif(data);
      fields.push(...exif.fields);
      if (exif.orientationFingerprint) orientations.push(exif.orientationFingerprint);
      if (exif.densityFingerprint) densities.push(exif.densityFingerprint);
    } else if (chunk.type === "XMP ") {
      fields.push(...inspectXmp(data));
    } else if (chunk.type === "IPTC") {
      fields.push(...inspectIptc(data));
    }
    if (chunk.type === "ICCP") profiles.push(data);
    if (chunk.type === "ALPH") alpha.push(data);
    if (chunk.type === "VP8L") alpha.push(Uint8Array.of(0x01));
    if (chunk.type === "VP8X" && data.length > 0 && (data[0] & 0x10) !== 0) {
      alpha.push(Uint8Array.of(0x10));
    }
  });
  return {
    fields: uniqueBy(fields, (field) => `${field.source}:${field.category}:${field.label}:${field.value ?? ""}`),
    provenance: uniqueBy(provenance, (indicator) => `${indicator.kind}:${indicator.container}`),
    colorProfileFingerprint: fingerprint(profiles),
    orientationFingerprint: orientations.sort().join("|"),
    densityFingerprint: densities.sort().join("|"),
    alphaFingerprint: fingerprint(alpha),
  };
}

function replaceChunkData(
  bytes: Uint8Array,
  chunk: WebPChunk,
  replacement: Uint8Array,
): Uint8Array {
  if (replacement.length !== chunk.dataEnd - chunk.dataStart) {
    malformed("A lossless WebP metadata replacement changed its chunk length.");
  }
  const output = bytes.slice(chunk.start, chunk.end);
  output.set(replacement, chunk.dataStart - chunk.start);
  return output;
}

function updateVp8xMetadataFlags(
  chunk: OutputChunk,
  removeExifFlag: boolean,
  removeXmpFlag: boolean,
): OutputChunk {
  if (chunk.type !== "VP8X" || chunk.bytes.length < 18 || (!removeExifFlag && !removeXmpFlag)) {
    return chunk;
  }
  const output = chunk.bytes.slice();
  if (removeExifFlag) output[8] &= ~0x08;
  if (removeXmpFlag) output[8] &= ~0x04;
  return { type: chunk.type, bytes: output };
}

export function cleanWebPBytes(
  bytes: Uint8Array,
  selected: ReadonlySet<MetadataCategory>,
): { bytes: Uint8Array; warnings: string[] } {
  const chunks = parseWebP(bytes);
  const outputChunks: OutputChunk[] = [];
  const warnings: string[] = [];
  const hadExif = chunks.some((chunk) => chunk.type === "EXIF");
  const hadXmp = chunks.some((chunk) => chunk.type === "XMP ");

  chunks.forEach((chunk, index) => {
    const original = bytes.subarray(chunk.start, chunk.end);
    const data = bytes.subarray(chunk.dataStart, chunk.dataEnd);
    const provenance = chunkProvenance(data, chunk, index);
    if (isProtectedProvenanceContainer(provenance)) {
      outputChunks.push({ type: chunk.type, bytes: original });
      if (selected.size > 0) {
        warnings.push(`WebP ${chunk.type.trim()} 청크에 출처 정보가 있어 해당 청크를 변경하지 않았습니다.`);
      }
      return;
    }
    if (chunk.type === "EXIF") {
      const cleaned = cleanExif(data, selected);
      outputChunks.push({
        type: chunk.type,
        bytes: cleaned.changed ? replaceChunkData(bytes, chunk, cleaned.bytes) : original,
      });
      return;
    }
    if (chunk.type === "XMP ") {
      if (selected.has("xmpIptc")) {
        return;
      }
      const cleaned = cleanXmp(data, selected);
      outputChunks.push({
        type: chunk.type,
        bytes: cleaned.changed ? replaceChunkData(bytes, chunk, cleaned.bytes) : original,
      });
      return;
    }
    if (chunk.type === "IPTC") {
      if (selected.has("xmpIptc")) {
        return;
      }
      const cleaned = cleanIptc(data, selected);
      outputChunks.push({
        type: chunk.type,
        bytes: cleaned.changed ? replaceChunkData(bytes, chunk, cleaned.bytes) : original,
      });
      return;
    }
    outputChunks.push({ type: chunk.type, bytes: original });
  });

  const hasExif = outputChunks.some((chunk) => chunk.type === "EXIF");
  const hasXmp = outputChunks.some((chunk) => chunk.type === "XMP ");
  const adjustedChunks = outputChunks.map((chunk) =>
    updateVp8xMetadataFlags(chunk, hadExif && !hasExif, hadXmp && !hasXmp),
  );
  const output = concatBytes([bytes.subarray(0, 12), ...adjustedChunks.map((chunk) => chunk.bytes)]);
  writeUint32LE(output, 4, output.length - 8);
  return { bytes: output, warnings: uniqueBy(warnings, (warning) => warning) };
}

export function webpImagePayload(bytes: Uint8Array): Uint8Array {
  const chunks = parseWebP(bytes);
  return concatBytes(
    chunks
      .filter((chunk) => ["VP8 ", "VP8L", "ALPH", "ANIM", "ANMF"].includes(chunk.type))
      .map((chunk) => bytes.subarray(chunk.start, chunk.end)),
  );
}
