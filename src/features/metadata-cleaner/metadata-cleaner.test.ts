import { describe, expect, it } from "vitest";

import {
  cleanMetadata,
  detectMetadataFormat,
  inspectMetadata,
  METADATA_CATEGORIES,
  MetadataCleanerError,
  type MetadataCategory,
} from "./index";

const encoder = new TextEncoder();

function text(value: string): Uint8Array {
  return encoder.encode(value);
}

function join(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u16be(value: number): Uint8Array {
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

function u32be(value: number): Uint8Array {
  return Uint8Array.of(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  );
}

function u32le(value: number): Uint8Array {
  return Uint8Array.of(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

interface TiffEntryInput {
  readonly tag: number;
  readonly type: 2 | 3 | 4 | 5;
  readonly value: number | Uint8Array;
  readonly count?: number;
}

function rational(...values: readonly [number, number][]): Uint8Array {
  const output = new Uint8Array(values.length * 8);
  const view = new DataView(output.buffer);
  values.forEach(([numerator, denominator], index) => {
    view.setUint32(index * 8, numerator, true);
    view.setUint32(index * 8 + 4, denominator, true);
  });
  return output;
}

function asciiValue(value: string): Uint8Array {
  return text(`${value}\0`);
}

function makeExifTiff(): Uint8Array {
  const output = new Uint8Array(906);
  const view = new DataView(output.buffer);
  output.set(text("II"), 0);
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);

  let valueOffset = 400;
  const writeIfd = (offset: number, entries: readonly TiffEntryInput[], nextIfd = 0): void => {
    view.setUint16(offset, entries.length, true);
    entries.forEach((entry, index) => {
      const at = offset + 2 + index * 12;
      view.setUint16(at, entry.tag, true);
      view.setUint16(at + 2, entry.type, true);
      const valueBytes = typeof entry.value === "number" ? undefined : entry.value;
      const count = entry.count ?? (valueBytes ? valueBytes.length / (entry.type === 5 ? 8 : 1) : 1);
      view.setUint32(at + 4, count, true);
      if (typeof entry.value === "number") {
        if (entry.type === 3) view.setUint16(at + 8, entry.value, true);
        else view.setUint32(at + 8, entry.value, true);
      } else if (entry.value.length <= 4) {
        output.set(entry.value, at + 8);
      } else {
        view.setUint32(at + 8, valueOffset, true);
        output.set(entry.value, valueOffset);
        valueOffset += entry.value.length + (entry.value.length & 1);
      }
    });
    view.setUint32(offset + 2 + entries.length * 12, nextIfd, true);
  };

  writeIfd(
    8,
    [
      { tag: 0x010e, type: 2, value: asciiValue("private description") },
      { tag: 0x010f, type: 2, value: asciiValue("Acme Camera") },
      { tag: 0x0110, type: 2, value: asciiValue("Pocket One") },
      { tag: 0x0112, type: 3, value: 6 },
      { tag: 0x011a, type: 5, value: rational([300, 1]) },
      { tag: 0x011b, type: 5, value: rational([300, 1]) },
      { tag: 0x0128, type: 3, value: 2 },
      { tag: 0x0131, type: 2, value: asciiValue("Private Editor") },
      { tag: 0x0132, type: 2, value: asciiValue("2026:07:22 12:34:56") },
      { tag: 0x013b, type: 2, value: asciiValue("Jane Photographer") },
      { tag: 0x8769, type: 4, value: 160 },
      { tag: 0x8825, type: 4, value: 220 },
    ],
    300,
  );
  writeIfd(160, [
    { tag: 0x9003, type: 2, value: asciiValue("2026:07:21 10:20:30") },
    { tag: 0xa434, type: 2, value: asciiValue("Secret Lens 50mm") },
    { tag: 0xa430, type: 2, value: asciiValue("Jane Photographer") },
    { tag: 0x9286, type: 2, value: asciiValue("private user comment") },
  ]);
  writeIfd(220, [
    { tag: 0x0001, type: 2, value: asciiValue("N") },
    { tag: 0x0002, type: 5, value: rational([37, 1], [33, 1], [1234, 100]) },
    { tag: 0x0003, type: 2, value: asciiValue("E") },
    { tag: 0x0004, type: 5, value: rational([126, 1], [59, 1], [4321, 100]) },
    { tag: 0x001d, type: 2, value: asciiValue("2026:07:21") },
  ]);
  writeIfd(300, [
    { tag: 0x0112, type: 3, value: 6 },
    { tag: 0x0201, type: 4, value: 900 },
    { tag: 0x0202, type: 4, value: 6 },
  ]);
  output.set(Uint8Array.of(0xff, 0xd8, 0x11, 0x22, 0xff, 0xd9), 900);
  return output;
}

function jpegSegment(marker: number, data: Uint8Array): Uint8Array {
  return join(Uint8Array.of(0xff, marker), u16be(data.length + 2), data);
}

function iim(dataset: number, value: string): Uint8Array {
  const bytes = text(value);
  return join(Uint8Array.of(0x1c, 0x02, dataset), u16be(bytes.length), bytes);
}

function makeJpeg(options: { protectedXmp?: boolean } = {}): Uint8Array {
  const jfif = join(
    text("JFIF\0"),
    Uint8Array.of(1, 2, 1),
    u16be(300),
    u16be(300),
    Uint8Array.of(0, 0),
  );
  const icc = join(text("ICC_PROFILE\0"), Uint8Array.of(1, 1), text("profile-bytes"));
  const xmpXml = text(
    `<?xpacket begin="x"?><rdf:RDF><rdf:Description dc:creator="Jane" exif:GPSLatitude="37.5" xmp:CreatorTool="Editor"${
      options.protectedXmp ? ' c2pa:manifest="Content Credentials"' : ""
    }><dc:description>private caption</dc:description></rdf:Description></rdf:RDF>`,
  );
  const xmp = join(text("http://ns.adobe.com/xap/1.0/\0"), xmpXml);
  const iptc = join(text("Photoshop 3.0\0"), iim(80, "Jane"), iim(90, "Seoul"), iim(120, "Caption"));
  const jumbf = join(
    Uint8Array.of(0x4a, 0x50, 0x00, 0x01),
    text("jumb c2pa Content Credentials"),
  );
  const sosAndScan = Uint8Array.of(
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0x13, 0x37, 0xff, 0x00, 0xa5, 0x5a, 0xff, 0xd9,
  );
  return join(
    Uint8Array.of(0xff, 0xd8),
    jpegSegment(0xe0, jfif),
    jpegSegment(0xe2, icc),
    jpegSegment(0xe1, join(text("Exif\0\0"), makeExifTiff())),
    jpegSegment(0xe1, xmp),
    jpegSegment(0xed, iptc),
    jpegSegment(0xeb, jumbf),
    jpegSegment(0xfe, text("private JPEG comment")),
    sosAndScan,
  );
}

function findSubarray(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let offset = 0; offset <= haystack.length - needle.length; offset += 1) {
    for (let index = 0; index < needle.length; index += 1) {
      if (haystack[offset + index] !== needle[index]) continue outer;
    }
    return offset;
  }
  return -1;
}

function jpegTail(bytes: Uint8Array): Uint8Array {
  const marker = Uint8Array.of(0xff, 0xda, 0x00, 0x08);
  const offset = findSubarray(bytes, marker);
  if (offset < 0) throw new Error("SOS not found");
  return bytes.subarray(offset);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = text(type);
  return join(u32be(data.length), typeBytes, data, u32be(crc32(join(typeBytes, data))));
}

function makePng(): Uint8Array {
  const ihdr = join(u32be(2), u32be(2), Uint8Array.of(8, 6, 0, 0, 0));
  const phys = join(u32be(11_811), u32be(11_811), Uint8Array.of(1));
  const xmp = text(
    '<rdf:RDF><rdf:Description dc:creator="Jane" exif:GPSLongitude="126.9"><dc:description>Private</dc:description></rdf:Description></rdf:RDF>',
  );
  const itxt = join(text("XML:com.adobe.xmp\0"), Uint8Array.of(0, 0, 0, 0), xmp);
  return join(
    Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    pngChunk("IHDR", ihdr),
    pngChunk("iCCP", join(text("PixelFit RGB\0"), Uint8Array.of(0, 1, 2, 3, 4))),
    pngChunk("pHYs", phys),
    pngChunk("eXIf", makeExifTiff()),
    pngChunk("tEXt", join(text("Author\0"), text("Jane"))),
    pngChunk("iTXt", itxt),
    pngChunk("caBX", text("jumb c2pa Content Credentials manifest")),
    pngChunk("IDAT", Uint8Array.of(0x78, 0x9c, 0x63, 0x60, 0x18, 0x05, 0, 1)),
    pngChunk("IEND", new Uint8Array()),
  );
}

interface TestPngChunk {
  readonly type: string;
  readonly raw: Uint8Array;
  readonly data: Uint8Array;
  readonly crcValid: boolean;
}

function pngChunks(bytes: Uint8Array): TestPngChunk[] {
  const chunks: TestPngChunk[] = [];
  let offset = 8;
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;
    const expectedCrc = new DataView(bytes.buffer, bytes.byteOffset + offset + 8 + length, 4).getUint32(0);
    chunks.push({
      type,
      raw: bytes.slice(offset, end),
      data: bytes.slice(offset + 8, offset + 8 + length),
      crcValid: expectedCrc === crc32(bytes.subarray(offset + 4, offset + 8 + length)),
    });
    offset = end;
  }
  return chunks;
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  return join(text(type), u32le(data.length), data, data.length % 2 === 1 ? Uint8Array.of(0) : new Uint8Array());
}

function makeWebP(imageChunk: "VP8 " | "VP8L" = "VP8 "): Uint8Array {
  const chunks = join(
    webpChunk("VP8X", Uint8Array.of(0x3c, 0, 0, 0, 1, 0, 0, 1, 0, 0)),
    webpChunk("ICCP", text("webp-color-profile")),
    webpChunk("ALPH", Uint8Array.of(1, 2, 3, 4)),
    webpChunk(imageChunk, Uint8Array.of(0x9d, 0x01, 0x2a, 0xaa, 0xbb, 0xcc)),
    webpChunk("EXIF", makeExifTiff()),
    webpChunk(
      "XMP ",
      text('<rdf:RDF><rdf:Description dc:creator="Jane"><dc:description>Private</dc:description></rdf:Description></rdf:RDF>'),
    ),
    webpChunk("C2PA", text("jumb c2pa Content Credentials manifest")),
  );
  return join(text("RIFF"), u32le(chunks.length + 4), text("WEBP"), chunks);
}

interface TestWebPChunk {
  readonly type: string;
  readonly raw: Uint8Array;
  readonly data: Uint8Array;
}

function webpChunks(bytes: Uint8Array): TestWebPChunk[] {
  const chunks: TestWebPChunk[] = [];
  let offset = 12;
  while (offset < bytes.length) {
    const type = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
    const end = offset + 8 + length + (length & 1);
    chunks.push({ type, raw: bytes.slice(offset, end), data: bytes.slice(offset + 8, offset + 8 + length) });
    offset = end;
  }
  return chunks;
}

function chunkByType<T extends { readonly type: string }>(chunks: readonly T[], type: string): T {
  const chunk = chunks.find((candidate) => candidate.type === type);
  if (!chunk) throw new Error(`${type} chunk missing`);
  return chunk;
}

describe("metadata format detection", () => {
  it("uses byte signatures instead of trusting MIME", () => {
    const jpeg = makeJpeg();
    const inspection = inspectMetadata(jpeg, "image/png");

    expect(detectMetadataFormat(jpeg)).toBe("jpeg");
    expect(inspection.detectedMime).toBe("image/jpeg");
    expect(inspection.mimeMatchesSignature).toBe(false);
  });

  it("rejects unsupported and structurally truncated files with typed errors", () => {
    expect(() => inspectMetadata(text("not an image"), "image/jpeg")).toThrowError(MetadataCleanerError);
    expect(() => inspectMetadata(Uint8Array.of(0xff, 0xd8, 0xff, 0xff), "image/jpeg")).toThrowError(
      /Truncated JPEG marker/,
    );
    expect(() => inspectMetadata(join(text("RIFF"), u32le(99), text("WEBP")), "image/webp")).toThrowError(
      MetadataCleanerError,
    );
  });

  it("rejects provenance labels passed as a removable category", () => {
    expect(() => cleanMetadata(makeJpeg(), "image/jpeg", ["c2pa" as MetadataCategory])).toThrowError(
      /제거할 수 없는/,
    );
  });
});

describe("JPEG lossless metadata cleaning", () => {
  it("finds every human privacy category and non-removable provenance", () => {
    const inspection = inspectMetadata(makeJpeg(), "image/jpeg");

    expect(inspection.categories).toEqual(METADATA_CATEGORIES);
    expect(new Set(inspection.provenance.map((item) => item.kind))).toEqual(
      new Set(["c2pa", "jumbf", "contentCredentials"]),
    );
    expect(inspection.provenance.every((item) => item.removable === false)).toBe(true);
    expect(inspection.preservation.pixelPayload).toBe("preserved");
  });

  it("removes selected private data while retaining scan bytes, JFIF, ICC, orientation, DPI, and APP11", () => {
    const original = makeJpeg();
    const jfifNeedle = text("JFIF\0");
    const iccNeedle = text("ICC_PROFILE\0");
    const provenanceNeedle = text("jumb c2pa Content Credentials");
    const result = cleanMetadata(original, "image/jpeg", METADATA_CATEGORIES);
    const after = inspectMetadata(result.bytes, "image/jpeg");

    expect(after.categories).toEqual([]);
    expect(jpegTail(result.bytes)).toEqual(jpegTail(original));
    expect(findSubarray(result.bytes, jfifNeedle)).toBeGreaterThanOrEqual(0);
    expect(findSubarray(result.bytes, iccNeedle)).toBeGreaterThanOrEqual(0);
    expect(findSubarray(result.bytes, provenanceNeedle)).toBeGreaterThanOrEqual(0);
    expect(result.report.removedCategories).toEqual(METADATA_CATEGORIES);
    expect(result.report.preservation).toMatchObject({
      pixelPayloadPreserved: true,
      reencoded: false,
      qualityChangeExpected: false,
      colorProfilePreserved: true,
      orientationPreserved: true,
      densityPreserved: true,
      provenanceBytesPreserved: true,
    });
    expect(result.report.provenanceMayBeInvalidated).toBe(true);
    expect(result.report.warnings.join(" ")).toMatch(/자격 증명.*유효하지 않을 수/);
  });

  it("removes only the selected category", () => {
    const original = makeJpeg();
    const result = cleanMetadata(original, "image/jpeg", ["gps"]);
    const after = inspectMetadata(result.bytes, "image/jpeg");

    expect(after.categories).not.toContain("gps");
    expect(after.categories).toEqual(expect.arrayContaining(["device", "lens", "date", "author"]));
    expect(jpegTail(result.bytes)).toEqual(jpegTail(original));
  });

  it("does not alter an XMP container that also carries Content Credentials", () => {
    const original = makeJpeg({ protectedXmp: true });
    const result = cleanMetadata(original, "image/jpeg", ["author", "xmpIptc"]);
    const after = inspectMetadata(result.bytes, "image/jpeg");

    expect(after.categories).toEqual(expect.arrayContaining(["author", "xmpIptc"]));
    expect(result.report.remainingSelectedCategories).toEqual(expect.arrayContaining(["author", "xmpIptc"]));
    expect(result.report.warnings.join(" ")).toMatch(/출처 정보/);
  });
});

describe("PNG lossless metadata cleaning", () => {
  it("removes PNG text and eXIf privacy fields while preserving IDAT, iCCP, pHYs, and alpha", () => {
    const original = makePng();
    const beforeChunks = pngChunks(original);
    const result = cleanMetadata(original, "image/png", METADATA_CATEGORIES);
    const afterChunks = pngChunks(result.bytes);
    const after = inspectMetadata(result.bytes, "image/png");

    expect(after.categories).toEqual([]);
    expect(chunkByType(afterChunks, "IDAT").raw).toEqual(chunkByType(beforeChunks, "IDAT").raw);
    expect(chunkByType(afterChunks, "iCCP").raw).toEqual(chunkByType(beforeChunks, "iCCP").raw);
    expect(chunkByType(afterChunks, "pHYs").raw).toEqual(chunkByType(beforeChunks, "pHYs").raw);
    expect(chunkByType(afterChunks, "IHDR").data[9]).toBe(6);
    expect(chunkByType(afterChunks, "caBX").raw).toEqual(chunkByType(beforeChunks, "caBX").raw);
    expect(afterChunks.some((chunk) => chunk.type === "iTXt")).toBe(false);
    expect(afterChunks.some((chunk) => chunk.type === "tEXt")).toBe(false);
    expect(afterChunks.every((chunk) => chunk.crcValid)).toBe(true);
    expect(result.report.preservation).toMatchObject({
      colorProfilePreserved: true,
      orientationPreserved: true,
      densityPreserved: true,
      alphaPreserved: true,
      provenanceBytesPreserved: true,
    });
  });

  it("uses signature parsing even with an octet-stream MIME", () => {
    const inspection = inspectMetadata(makePng(), "application/octet-stream");
    expect(inspection.format).toBe("png");
    expect(inspection.mimeMatchesSignature).toBe(true);
    expect(inspection.hasProvenance).toBe(true);
  });
});

describe("WebP lossless metadata cleaning", () => {
  it("preserves VP8/ALPH/ICC payloads, clears only the removed XMP flag, and updates RIFF size", () => {
    const original = makeWebP();
    const beforeChunks = webpChunks(original);
    const result = cleanMetadata(original, "image/webp", METADATA_CATEGORIES);
    const afterChunks = webpChunks(result.bytes);
    const after = inspectMetadata(result.bytes, "image/webp");

    expect(after.categories).toEqual([]);
    expect(chunkByType(afterChunks, "VP8 ").raw).toEqual(chunkByType(beforeChunks, "VP8 ").raw);
    expect(chunkByType(afterChunks, "ALPH").raw).toEqual(chunkByType(beforeChunks, "ALPH").raw);
    expect(chunkByType(afterChunks, "ICCP").raw).toEqual(chunkByType(beforeChunks, "ICCP").raw);
    expect(chunkByType(afterChunks, "C2PA").raw).toEqual(chunkByType(beforeChunks, "C2PA").raw);
    expect(afterChunks.some((chunk) => chunk.type === "XMP ")).toBe(false);
    const beforeVp8x = chunkByType(beforeChunks, "VP8X").data;
    const afterVp8x = chunkByType(afterChunks, "VP8X").data;
    expect(afterVp8x[0]).toBe(beforeVp8x[0] & ~0x04);
    expect(afterVp8x.subarray(1)).toEqual(beforeVp8x.subarray(1));
    expect(new DataView(result.bytes.buffer, result.bytes.byteOffset + 4, 4).getUint32(0, true)).toBe(
      result.bytes.length - 8,
    );
    expect(result.report.preservation).toMatchObject({
      pixelPayloadPreserved: true,
      colorProfilePreserved: true,
      orientationPreserved: true,
      densityPreserved: true,
      alphaPreserved: true,
      provenanceBytesPreserved: true,
    });
  });

  it("returns byte-identical output when no categories are selected", () => {
    const original = makeWebP();
    const result = cleanMetadata(original, "image/webp", []);
    expect(result.bytes).toEqual(original);
    expect(result.report.changed).toBe(false);
    expect(result.report.provenanceMayBeInvalidated).toBe(false);
  });

  it("also preserves a VP8L lossless image chunk byte-for-byte", () => {
    const original = makeWebP("VP8L");
    const before = chunkByType(webpChunks(original), "VP8L").raw;
    const result = cleanMetadata(original, "image/webp", ["author", "xmpIptc"]);

    expect(chunkByType(webpChunks(result.bytes), "VP8L").raw).toEqual(before);
    expect(result.report.preservation.pixelPayloadPreserved).toBe(true);
  });
});
