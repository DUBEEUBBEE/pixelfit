import { ascii, bytesEqual, startsWithAscii, uniqueBy, utf8 } from "./binary";
import type { MetadataCategory, MetadataFinding } from "./types";

type IfdKind = "ifd0" | "exif" | "gps" | "ifd1" | "interop";

interface TiffEntry {
  readonly ifd: IfdKind;
  readonly tag: number;
  readonly type: number;
  readonly count: number;
  readonly entryOffset: number;
  readonly valueStart: number;
  readonly valueLength: number;
}

interface ParsedTiff {
  readonly tiff: Uint8Array;
  readonly headerLength: number;
  readonly littleEndian: boolean;
  readonly entries: readonly TiffEntry[];
}

export interface ExifInspectionResult {
  readonly fields: readonly MetadataFinding[];
  readonly orientationFingerprint: string;
  readonly densityFingerprint: string;
}

const TYPE_SIZES = new Map<number, number>([
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 4],
  [5, 8],
  [6, 1],
  [7, 1],
  [8, 2],
  [9, 4],
  [10, 8],
  [11, 4],
  [12, 8],
  [13, 4],
]);

const MAX_IFD_ENTRIES = 4096;
const MAX_IFDS = 32;

function readU16(bytes: Uint8Array, offset: number, littleEndian: boolean): number | undefined {
  if (offset < 0 || offset + 2 > bytes.length) {
    return undefined;
  }
  return littleEndian
    ? bytes[offset] + bytes[offset + 1] * 0x100
    : bytes[offset] * 0x100 + bytes[offset + 1];
}

function readU32(bytes: Uint8Array, offset: number, littleEndian: boolean): number | undefined {
  if (offset < 0 || offset + 4 > bytes.length) {
    return undefined;
  }
  return littleEndian
    ? bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x1000000
    : bytes[offset] * 0x1000000 + bytes[offset + 1] * 0x10000 + bytes[offset + 2] * 0x100 + bytes[offset + 3];
}

function parseTiff(bytes: Uint8Array): ParsedTiff | undefined {
  const headerLength = startsWithAscii(bytes, "Exif\0\0") ? 6 : 0;
  const tiff = bytes.subarray(headerLength);
  if (tiff.length < 8) {
    return undefined;
  }
  const byteOrder = ascii(tiff, 0, 2);
  if (byteOrder !== "II" && byteOrder !== "MM") {
    return undefined;
  }
  const littleEndian = byteOrder === "II";
  if (readU16(tiff, 2, littleEndian) !== 42) {
    return undefined;
  }
  const firstIfd = readU32(tiff, 4, littleEndian);
  if (firstIfd === undefined) {
    return undefined;
  }

  const entries: TiffEntry[] = [];
  const visited = new Set<string>();

  const parseIfd = (ifdOffset: number, kind: IfdKind): number | undefined => {
    if (visited.size >= MAX_IFDS || ifdOffset < 8 || ifdOffset + 2 > tiff.length) {
      return undefined;
    }
    const visitKey = `${kind}:${ifdOffset}`;
    if (visited.has(visitKey)) {
      return undefined;
    }
    visited.add(visitKey);

    const declaredCount = readU16(tiff, ifdOffset, littleEndian);
    if (declaredCount === undefined) {
      return undefined;
    }
    if (declaredCount > MAX_IFD_ENTRIES) {
      return undefined;
    }
    const count = declaredCount;
    if (ifdOffset + 2 + count * 12 + 4 > tiff.length) {
      return undefined;
    }

    let exifPointer: number | undefined;
    let gpsPointer: number | undefined;
    let interopPointer: number | undefined;
    for (let index = 0; index < count; index += 1) {
      const entryOffset = ifdOffset + 2 + index * 12;
      const tag = readU16(tiff, entryOffset, littleEndian);
      const type = readU16(tiff, entryOffset + 2, littleEndian);
      const valueCount = readU32(tiff, entryOffset + 4, littleEndian);
      if (tag === undefined || type === undefined || valueCount === undefined) {
        continue;
      }
      const typeSize = TYPE_SIZES.get(type);
      if (!typeSize || valueCount > Math.floor(Number.MAX_SAFE_INTEGER / typeSize)) {
        continue;
      }
      const valueLength = valueCount * typeSize;
      const pointedOffset = readU32(tiff, entryOffset + 8, littleEndian);
      const valueStart = valueLength <= 4 ? entryOffset + 8 : pointedOffset;
      if (valueStart === undefined || valueStart < 0 || valueLength > tiff.length - valueStart) {
        continue;
      }
      const entry: TiffEntry = {
        ifd: kind,
        tag,
        type,
        count: valueCount,
        entryOffset,
        valueStart,
        valueLength,
      };
      entries.push(entry);

      const pointer = numericValues(tiff, entry, littleEndian)[0];
      if (kind === "ifd0" && tag === 0x8769) {
        exifPointer = pointer;
      } else if (kind === "ifd0" && tag === 0x8825) {
        gpsPointer = pointer;
      } else if (kind === "exif" && tag === 0xa005) {
        interopPointer = pointer;
      }
    }

    if (exifPointer) {
      parseIfd(exifPointer, "exif");
    }
    if (gpsPointer) {
      parseIfd(gpsPointer, "gps");
    }
    if (interopPointer) {
      parseIfd(interopPointer, "interop");
    }
    return readU32(tiff, ifdOffset + 2 + count * 12, littleEndian);
  };

  const nextIfd = parseIfd(firstIfd, "ifd0");
  if (nextIfd) {
    parseIfd(nextIfd, "ifd1");
  }
  return { tiff, headerLength, littleEndian, entries };
}

function numericValues(
  tiff: Uint8Array,
  entry: TiffEntry,
  littleEndian: boolean,
): number[] {
  const values: number[] = [];
  const maxValues = Math.min(entry.count, 64);
  if (entry.type === 1 || entry.type === 6 || entry.type === 7) {
    for (let index = 0; index < maxValues; index += 1) {
      values.push(tiff[entry.valueStart + index]);
    }
  } else if (entry.type === 3 || entry.type === 8) {
    for (let index = 0; index < maxValues; index += 1) {
      const value = readU16(tiff, entry.valueStart + index * 2, littleEndian);
      if (value !== undefined) {
        values.push(value);
      }
    }
  } else if (entry.type === 4 || entry.type === 9 || entry.type === 13) {
    for (let index = 0; index < maxValues; index += 1) {
      const value = readU32(tiff, entry.valueStart + index * 4, littleEndian);
      if (value !== undefined) {
        values.push(value);
      }
    }
  }
  return values;
}

function rationalValue(
  tiff: Uint8Array,
  offset: number,
  littleEndian: boolean,
): string | undefined {
  const numerator = readU32(tiff, offset, littleEndian);
  const denominator = readU32(tiff, offset + 4, littleEndian);
  if (numerator === undefined || denominator === undefined || denominator === 0) {
    return undefined;
  }
  const value = numerator / denominator;
  return Number.isInteger(value) ? String(value) : value.toFixed(5).replace(/0+$/, "");
}

function entryDisplayValue(parsed: ParsedTiff, entry: TiffEntry): string | undefined {
  const { tiff, littleEndian } = parsed;
  if (entry.type === 2) {
    const value = utf8(tiff.subarray(entry.valueStart, entry.valueStart + entry.valueLength))
      .replace(/\0.*$/s, "")
      .trim();
    return value || undefined;
  }
  if (entry.ifd === "ifd0" && [0x9c9b, 0x9c9c, 0x9c9d, 0x9c9e, 0x9c9f].includes(entry.tag)) {
    let value = "";
    for (let offset = entry.valueStart; offset + 1 < entry.valueStart + entry.valueLength; offset += 2) {
      const codePoint = tiff[offset] + tiff[offset + 1] * 0x100;
      if (codePoint === 0) {
        break;
      }
      value += String.fromCharCode(codePoint);
    }
    return value.trim() || undefined;
  }
  if (entry.type === 5 || entry.type === 10) {
    const values: string[] = [];
    for (let index = 0; index < Math.min(entry.count, 4); index += 1) {
      const value = rationalValue(tiff, entry.valueStart + index * 8, littleEndian);
      if (value) {
        values.push(value);
      }
    }
    return values.length > 0 ? values.join(", ") : undefined;
  }
  const values = numericValues(tiff, entry, littleEndian);
  return values.length > 0 ? values.join(", ") : undefined;
}

function categoryForEntry(entry: TiffEntry): MetadataCategory | undefined {
  if (entry.ifd === "gps") {
    return [0x07, 0x1d].includes(entry.tag) ? "date" : "gps";
  }
  if (entry.ifd === "ifd0" || entry.ifd === "ifd1") {
    if ([0x010f, 0x0110].includes(entry.tag)) return "device";
    if (entry.tag === 0x0131) return "software";
    if (entry.tag === 0x0132) return "date";
    if ([0x013b, 0x8298, 0x9c9d].includes(entry.tag)) return "author";
    if ([0x010e, 0x9c9b, 0x9c9c, 0x9c9f].includes(entry.tag)) return "description";
    if (entry.tag === 0x9c9e) return "xmpIptc";
  }
  if (entry.ifd === "exif") {
    if ([0x9003, 0x9004, 0x9010, 0x9011, 0x9012, 0x9290, 0x9291, 0x9292].includes(entry.tag)) return "date";
    if ([0x927c, 0xa420, 0xa431].includes(entry.tag)) return "device";
    if ([0xa432, 0xa433, 0xa434, 0xa435].includes(entry.tag)) return "lens";
    if ([0x8298, 0xa430].includes(entry.tag)) return "author";
    if (entry.tag === 0x9286) return "description";
  }
  return undefined;
}

function entryLabel(entry: TiffEntry, category: MetadataCategory): string {
  const known = new Map<number, string>([
    [0x010e, "이미지 설명"],
    [0x010f, "기기 제조사"],
    [0x0110, "기기 모델"],
    [0x0131, "소프트웨어"],
    [0x0132, "수정 시각"],
    [0x013b, "작성자"],
    [0x8298, "저작권"],
    [0x9003, "촬영 시각"],
    [0x9004, "디지털화 시각"],
    [0x927c, "기기 제조사 메모"],
    [0x9286, "사용자 설명"],
    [0xa430, "카메라 소유자"],
    [0xa431, "카메라 일련번호"],
    [0xa433, "렌즈 제조사"],
    [0xa434, "렌즈 모델"],
    [0xa435, "렌즈 일련번호"],
  ]);
  if (entry.ifd === "gps") {
    return [0x07, 0x1d].includes(entry.tag) ? "GPS 기록 시각" : "GPS 위치";
  }
  return known.get(entry.tag) ?? {
    gps: "GPS 위치",
    device: "촬영 기기",
    lens: "렌즈 정보",
    date: "촬영일",
    software: "편집 프로그램",
    author: "작성자",
    description: "설명",
    thumbnail: "미리보기 이미지",
    xmpIptc: "기타 EXIF 정보",
  }[category];
}

function thumbnailRanges(parsed: ParsedTiff): Array<{ start: number; end: number }> {
  const { entries, tiff, littleEndian } = parsed;
  const ifd1 = entries.filter((entry) => entry.ifd === "ifd1");
  const jpegOffset = ifd1.find((entry) => entry.tag === 0x0201);
  const jpegLength = ifd1.find((entry) => entry.tag === 0x0202);
  const ranges: Array<{ start: number; end: number }> = [];
  if (jpegOffset && jpegLength) {
    const start = numericValues(tiff, jpegOffset, littleEndian)[0];
    const length = numericValues(tiff, jpegLength, littleEndian)[0];
    if (start !== undefined && length !== undefined && length > 0 && start <= tiff.length - length) {
      ranges.push({ start, end: start + length });
    }
  }

  const stripOffsets = ifd1.find((entry) => entry.tag === 0x0111);
  const stripLengths = ifd1.find((entry) => entry.tag === 0x0117);
  if (stripOffsets && stripLengths) {
    const offsets = numericValues(tiff, stripOffsets, littleEndian);
    const lengths = numericValues(tiff, stripLengths, littleEndian);
    for (let index = 0; index < Math.min(offsets.length, lengths.length); index += 1) {
      const start = offsets[index];
      const length = lengths[index];
      if (length > 0 && start <= tiff.length - length) {
        ranges.push({ start, end: start + length });
      }
    }
  }
  return ranges;
}

function invariantFingerprint(parsed: ParsedTiff | undefined, tags: readonly number[]): string {
  if (!parsed) return "";
  return parsed.entries
    .filter((entry) => tags.includes(entry.tag))
    .map((entry) => {
      const bytes = parsed.tiff.subarray(entry.valueStart, entry.valueStart + entry.valueLength);
      return `${entry.ifd}:${entry.tag}:${ascii(bytes)}`;
    })
    .sort()
    .join("|");
}

export function inspectExif(bytes: Uint8Array): ExifInspectionResult {
  const parsed = parseTiff(bytes);
  if (!parsed) {
    return { fields: [], orientationFingerprint: "", densityFingerprint: "" };
  }
  const fields: MetadataFinding[] = [];
  for (const entry of parsed.entries) {
    const category = categoryForEntry(entry);
    if (!category) continue;
    const value = entryDisplayValue(parsed, entry);
    if (!value || /^0(?:, 0)*$/.test(value)) continue;
    fields.push({
      id: `exif:${entry.ifd}:${entry.entryOffset}:${category}`,
      category,
      label: entryLabel(entry, category),
      value: value.length > 160 ? `${value.slice(0, 157)}…` : value,
      source: "exif",
      removable: true,
    });
  }
  const thumbnails = thumbnailRanges(parsed);
  if (thumbnails.length > 0) {
    fields.push({
      id: `exif:thumbnail:${thumbnails[0].start}`,
      category: "thumbnail",
      label: "포함된 EXIF 미리보기",
      value: `${thumbnails.reduce((sum, range) => sum + range.end - range.start, 0)} bytes`,
      source: "exif",
      removable: true,
    });
  }
  return {
    fields: uniqueBy(fields, (field) => `${field.category}:${field.label}:${field.value ?? ""}`),
    orientationFingerprint: invariantFingerprint(parsed, [0x0112]),
    densityFingerprint: invariantFingerprint(parsed, [0x011a, 0x011b, 0x0128]),
  };
}

function blankEntry(tiff: Uint8Array, entry: TiffEntry): boolean {
  let changed = false;
  for (let offset = entry.valueStart; offset < entry.valueStart + entry.valueLength; offset += 1) {
    if (tiff[offset] !== 0) {
      tiff[offset] = 0;
      changed = true;
    }
  }
  for (let offset = entry.entryOffset; offset < entry.entryOffset + 12; offset += 1) {
    if (tiff[offset] !== 0) {
      tiff[offset] = 0;
      changed = true;
    }
  }
  return changed;
}

export function cleanExif(
  bytes: Uint8Array,
  selected: ReadonlySet<MetadataCategory>,
): { bytes: Uint8Array; changed: boolean } {
  const parsed = parseTiff(bytes);
  if (!parsed) {
    return { bytes, changed: false };
  }
  const output = bytes.slice();
  const tiff = output.subarray(parsed.headerLength);
  let changed = false;

  for (const entry of parsed.entries) {
    const category = categoryForEntry(entry);
    if (category && selected.has(category)) {
      changed = blankEntry(tiff, entry) || changed;
    }
  }

  if (selected.has("thumbnail")) {
    for (const range of thumbnailRanges(parsed)) {
      for (let offset = range.start; offset < range.end; offset += 1) {
        if (tiff[offset] !== 0) {
          tiff[offset] = 0;
          changed = true;
        }
      }
    }
    for (const entry of parsed.entries) {
      if (entry.ifd === "ifd1" && [0x0111, 0x0117, 0x0201, 0x0202].includes(entry.tag)) {
        changed = blankEntry(tiff, entry) || changed;
      }
    }
  }

  return { bytes: changed && !bytesEqual(bytes, output) ? output : bytes, changed };
}
