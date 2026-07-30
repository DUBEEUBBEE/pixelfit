import { describe, expect, it } from "vitest";
import { detectImageType, parseImageDimensions } from "./signatures";
import { createOutputFilename } from "./names";
import { formatBytes, MAX_IMAGE_EDGE, validateImageFile, validatePixelCount } from "./validation";

describe("file helpers", () => {
  it("detects signatures instead of trusting extensions", () => {
    expect(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("jpeg");
    expect(detectImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))).toBe("png");
    expect(detectImageType(new TextEncoder().encode("RIFF0000WEBP"))).toBe("webp");
    expect(detectImageType(new TextEncoder().encode("<svg>"))).toBeNull();
  });

  it("uses predictable ASCII names", () => {
    expect(createOutputFilename("passport-photo", "jpeg")).toBe("passport-photo-413x531.jpg");
    expect(createOutputFilename("favicon-maker", "zip")).toBe("favicon-package.zip");
  });

  it("formats file sizes", () => {
    expect(formatBytes(512_000)).toBe("500KB");
    expect(formatBytes(6 * 1024 * 1024)).toBe("6.0MB");
  });

  it("rejects extreme single-edge dimensions before a browser canvas allocation", () => {
    expect(() => validatePixelCount(8_000, 5_000)).not.toThrow();
    expect(() => validatePixelCount(MAX_IMAGE_EDGE + 1, 1)).toThrow(/한 변이 너무 깁니다/u);
  });
});

describe("encoded image dimensions", () => {
  it("reads JPEG SOF dimensions after bounded marker segments", () => {
    expect(parseImageDimensions(makeJpeg(4_032, 3_024, 0xc2), "jpeg")).toEqual({ width: 4_032, height: 3_024 });
  });

  it("reads PNG IHDR dimensions", () => {
    expect(parseImageDimensions(makePng(1_920, 1_080), "png")).toEqual({ width: 1_920, height: 1_080 });
  });

  it("reads WebP VP8, VP8L, and VP8X dimensions", () => {
    expect(parseImageDimensions(makeWebp("VP8 ", makeVp8Header(1_280, 720)), "webp")).toEqual({ width: 1_280, height: 720 });
    expect(parseImageDimensions(makeWebp("VP8L", makeVp8lHeader(997, 613)), "webp")).toEqual({ width: 997, height: 613 });
    expect(parseImageDimensions(makeWebp("VP8X", makeVp8xHeader(3_000, 2_000)), "webp")).toEqual({ width: 3_000, height: 2_000 });
  });

  it("rejects malformed or truncated JPEG, PNG, and WebP headers", () => {
    expect(() => parseImageDimensions(makeJpeg(640, 480).slice(0, 14), "jpeg")).toThrow(/segment|SOF/u);
    expect(() => parseImageDimensions(makePng(640, 480).slice(0, 24), "png")).toThrow(/IHDR/u);

    const truncatedWebp = makeWebp("VP8X", makeVp8xHeader(640, 480));
    truncatedWebp[4] += 8;
    expect(() => parseImageDimensions(truncatedWebp, "webp")).toThrow(/잘렸습니다/u);

    const malformedVp8 = makeWebp("VP8 ", makeVp8Header(640, 480));
    malformedVp8[23] = 0;
    expect(() => parseImageDimensions(malformedVp8, "webp")).toThrow(/key frame/u);
  });

  it("applies caller pixel and global edge limits before browser decoding", async () => {
    const tooManyPixelsBytes = makePng(101, 100);
    const tooManyPixels = new File([tooManyPixelsBytes.buffer as ArrayBuffer], "large.png", { type: "image/png" });
    await expect(validateImageFile(tooManyPixels, 1_024, 10_000)).rejects.toMatchObject({
      name: "ImageValidationError",
      code: "too-many-pixels",
    });

    const tooWideBytes = makePng(MAX_IMAGE_EDGE + 1, 1);
    const tooWide = new File([tooWideBytes.buffer as ArrayBuffer], "wide.png", { type: "image/png" });
    await expect(validateImageFile(tooWide, 1_024, 40_000_000)).rejects.toMatchObject({
      name: "ImageValidationError",
      code: "too-many-pixels",
    });
  });
});

function makeJpeg(width: number, height: number, sofMarker = 0xc0): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
    0xff, sofMarker, 0x00, 0x11, 0x08,
    (height >>> 8) & 0xff, height & 0xff,
    (width >>> 8) & 0xff, width & 0xff,
    0x03,
    0x01, 0x11, 0x00,
    0x02, 0x11, 0x01,
    0x03, 0x11, 0x01,
    0xff, 0xd9,
  ]);
}

function makePng(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  writeUint32Be(bytes, 8, 13);
  bytes.set(new TextEncoder().encode("IHDR"), 12);
  writeUint32Be(bytes, 16, width);
  writeUint32Be(bytes, 20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  return bytes;
}

function makeWebp(chunkType: "VP8 " | "VP8L" | "VP8X", data: Uint8Array): Uint8Array {
  const paddedLength = data.length + (data.length % 2);
  const bytes = new Uint8Array(20 + paddedLength);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  writeUint32Le(bytes, 4, bytes.length - 8);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  bytes.set(new TextEncoder().encode(chunkType), 12);
  writeUint32Le(bytes, 16, data.length);
  bytes.set(data, 20);
  return bytes;
}

function makeVp8Header(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(10);
  bytes.set([0x00, 0x00, 0x00, 0x9d, 0x01, 0x2a]);
  bytes[6] = width & 0xff;
  bytes[7] = (width >>> 8) & 0x3f;
  bytes[8] = height & 0xff;
  bytes[9] = (height >>> 8) & 0x3f;
  return bytes;
}

function makeVp8lHeader(width: number, height: number): Uint8Array {
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  return Uint8Array.from([
    0x2f,
    widthMinusOne & 0xff,
    ((widthMinusOne >>> 8) & 0x3f) | ((heightMinusOne & 0x03) << 6),
    (heightMinusOne >>> 2) & 0xff,
    (heightMinusOne >>> 10) & 0x0f,
  ]);
}

function makeVp8xHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(10);
  writeUint24Le(bytes, 4, width - 1);
  writeUint24Le(bytes, 7, height - 1);
  return bytes;
}

function writeUint24Le(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
}

function writeUint32Be(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function writeUint32Le(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}
