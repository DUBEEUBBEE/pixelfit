import {
  concatBytes,
  fingerprintBytes,
  malformed,
  readUint16BE,
  startsWithAscii,
  uniqueBy,
  utf8,
} from "./binary";
import { cleanExif, inspectExif } from "./exif";
import { detectProvenance, isProtectedProvenanceContainer } from "./provenance";
import { cleanIptc, cleanXmp, inspectIptc, inspectXmp } from "./textual";
import type {
  MetadataCategory,
  MetadataFinding,
  ProvenanceIndicator,
} from "./types";

interface JpegSegment {
  readonly marker: number;
  readonly start: number;
  readonly end: number;
  readonly dataStart: number;
  readonly dataEnd: number;
}

interface ParsedJpeg {
  readonly segments: readonly JpegSegment[];
  readonly tailStart: number;
}

export interface JpegAnalysis {
  readonly fields: readonly MetadataFinding[];
  readonly provenance: readonly ProvenanceIndicator[];
  readonly colorProfileFingerprint: string;
  readonly orientationFingerprint: string;
  readonly densityFingerprint: string;
  readonly alphaFingerprint: string;
}

const XMP_SIGNATURE = "http://ns.adobe.com/xap/1.0/\0";
const EXTENDED_XMP_SIGNATURE = "http://ns.adobe.com/xmp/extension/\0";

function isStandaloneMarker(marker: number): boolean {
  return marker === 0x01 || marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7);
}

function parseJpeg(bytes: Uint8Array): ParsedJpeg {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    malformed("The file does not have a valid JPEG signature.");
  }
  const segments: JpegSegment[] = [];
  let offset = 2;
  while (offset < bytes.length) {
    const start = offset;
    if (bytes[offset] !== 0xff) {
      malformed("Unexpected data before the JPEG scan.");
    }
    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= bytes.length) {
      malformed("Truncated JPEG marker.");
    }
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xda || marker === 0xd9) {
      return { segments, tailStart: start };
    }
    if (marker === 0x00) {
      malformed("A stuffed JPEG marker appeared before scan data.");
    }
    if (isStandaloneMarker(marker)) {
      segments.push({ marker, start, end: offset, dataStart: offset, dataEnd: offset });
      continue;
    }
    if (offset + 2 > bytes.length) {
      malformed("Truncated JPEG segment length.");
    }
    const segmentLength = readUint16BE(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      malformed("Invalid JPEG segment length.");
    }
    const dataStart = offset + 2;
    const end = offset + segmentLength;
    segments.push({ marker, start, end, dataStart, dataEnd: end });
    offset = end;
  }
  malformed("JPEG is missing a start-of-scan or end-of-image marker.");
}

function segmentData(bytes: Uint8Array, segment: JpegSegment): Uint8Array {
  return bytes.subarray(segment.dataStart, segment.dataEnd);
}

function segmentContainer(segment: JpegSegment, index: number): string {
  return `JPEG APP${segment.marker - 0xe0} #${index + 1}`;
}

function segmentProvenance(
  bytes: Uint8Array,
  segment: JpegSegment,
  index: number,
): ProvenanceIndicator[] {
  const data = segmentData(bytes, segment);
  const isJumbfApp11 = segment.marker === 0xeb && data.length >= 2 && data[0] === 0x4a && data[1] === 0x50;
  return detectProvenance(
    data,
    segmentContainer(segment, index),
    isJumbfApp11 ? ["jumbf"] : [],
  );
}

function fingerprint(parts: readonly Uint8Array[]): string {
  return parts.map(fingerprintBytes).join("|");
}

function commentFinding(data: Uint8Array, offset: number): MetadataFinding | undefined {
  const value = utf8(data).replace(/\0/g, "").trim();
  if (!value) return undefined;
  return {
    id: `jpeg-comment:${offset}`,
    category: "description",
    label: "JPEG 설명",
    value: value.length > 160 ? `${value.slice(0, 157)}…` : value,
    source: "jpeg-comment",
    removable: true,
  };
}

export function analyzeJpeg(bytes: Uint8Array): JpegAnalysis {
  const parsed = parseJpeg(bytes);
  const fields: MetadataFinding[] = [];
  const provenance: ProvenanceIndicator[] = [];
  const iccParts: Uint8Array[] = [];
  const orientation: string[] = [];
  const density: string[] = [];

  parsed.segments.forEach((segment, index) => {
    const data = segmentData(bytes, segment);
    provenance.push(...segmentProvenance(bytes, segment, index));

    if (segment.marker === 0xe1 && startsWithAscii(data, "Exif\0\0")) {
      const exif = inspectExif(data);
      fields.push(...exif.fields);
      if (exif.orientationFingerprint) orientation.push(exif.orientationFingerprint);
      if (exif.densityFingerprint) density.push(exif.densityFingerprint);
    } else if (
      segment.marker === 0xe1 &&
      (startsWithAscii(data, XMP_SIGNATURE) || startsWithAscii(data, EXTENDED_XMP_SIGNATURE))
    ) {
      const signatureLength = startsWithAscii(data, XMP_SIGNATURE)
        ? XMP_SIGNATURE.length
        : EXTENDED_XMP_SIGNATURE.length;
      fields.push(...inspectXmp(data.subarray(signatureLength)));
    } else if (segment.marker === 0xed) {
      fields.push(...inspectIptc(data));
    } else if (segment.marker === 0xfe) {
      const finding = commentFinding(data, segment.dataStart);
      if (finding) fields.push(finding);
    }

    if (segment.marker === 0xe2 && startsWithAscii(data, "ICC_PROFILE\0")) {
      iccParts.push(data);
    }
    if (segment.marker === 0xe0 && startsWithAscii(data, "JFIF\0") && data.length >= 12) {
      density.push(`jfif:${fingerprintBytes(data.subarray(7, 12))}`);
    }
  });

  return {
    fields: uniqueBy(fields, (field) => `${field.source}:${field.category}:${field.label}:${field.value ?? ""}`),
    provenance: uniqueBy(provenance, (indicator) => `${indicator.kind}:${indicator.container}`),
    colorProfileFingerprint: fingerprint(iccParts),
    orientationFingerprint: orientation.sort().join("|"),
    densityFingerprint: density.sort().join("|"),
    alphaFingerprint: "",
  };
}

function replaceSegmentData(
  bytes: Uint8Array,
  segment: JpegSegment,
  replacement: Uint8Array,
): Uint8Array {
  if (replacement.length !== segment.dataEnd - segment.dataStart) {
    malformed("A lossless JPEG metadata replacement changed its segment length.");
  }
  const output = bytes.slice(segment.start, segment.end);
  output.set(replacement, segment.dataStart - segment.start);
  return output;
}

export function cleanJpegBytes(
  bytes: Uint8Array,
  selected: ReadonlySet<MetadataCategory>,
): { bytes: Uint8Array; warnings: string[] } {
  const parsed = parseJpeg(bytes);
  const output: Uint8Array[] = [bytes.subarray(0, 2)];
  const warnings: string[] = [];

  parsed.segments.forEach((segment, index) => {
    const original = bytes.subarray(segment.start, segment.end);
    const data = segmentData(bytes, segment);
    const provenance = segmentProvenance(bytes, segment, index);
    if (isProtectedProvenanceContainer(provenance)) {
      output.push(original);
      if (selected.size > 0) {
        warnings.push(`${segmentContainer(segment, index)}에 출처 정보가 있어 해당 세그먼트를 변경하지 않았습니다.`);
      }
      return;
    }

    if (segment.marker === 0xe1 && startsWithAscii(data, "Exif\0\0")) {
      const cleaned = cleanExif(data, selected);
      output.push(cleaned.changed ? replaceSegmentData(bytes, segment, cleaned.bytes) : original);
      return;
    }
    if (
      segment.marker === 0xe1 &&
      (startsWithAscii(data, XMP_SIGNATURE) || startsWithAscii(data, EXTENDED_XMP_SIGNATURE))
    ) {
      if (selected.has("xmpIptc")) {
        return;
      }
      const cleaned = cleanXmp(data, selected);
      output.push(cleaned.changed ? replaceSegmentData(bytes, segment, cleaned.bytes) : original);
      return;
    }
    if (segment.marker === 0xed) {
      if (selected.has("xmpIptc")) {
        return;
      }
      const cleaned = cleanIptc(data, selected);
      output.push(cleaned.changed ? replaceSegmentData(bytes, segment, cleaned.bytes) : original);
      return;
    }
    if (segment.marker === 0xfe && selected.has("description")) {
      return;
    }
    output.push(original);
  });
  output.push(bytes.subarray(parsed.tailStart));
  return { bytes: concatBytes(output), warnings: uniqueBy(warnings, (warning) => warning) };
}

export function jpegScanData(bytes: Uint8Array): Uint8Array {
  const parsed = parseJpeg(bytes);
  return bytes.subarray(parsed.tailStart);
}
