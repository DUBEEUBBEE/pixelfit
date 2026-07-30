export type SupportedImageType = "jpeg" | "png" | "webp";
export type ImageDimensions = { width: number; height: number };

const mimeForType: Record<SupportedImageType, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);

export function detectImageType(bytes: Uint8Array): SupportedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) return "webp";
  return null;
}

export function parseImageDimensions(bytes: Uint8Array, type: SupportedImageType): ImageDimensions {
  if (detectImageType(bytes) !== type) throw new Error("이미지 서명과 요청한 형식이 일치하지 않습니다.");
  if (type === "jpeg") return parseJpegDimensions(bytes);
  if (type === "png") return parsePngDimensions(bytes);
  return parseWebpDimensions(bytes);
}

export function mimeFromImageType(type: SupportedImageType): string {
  return mimeForType[type];
}

export function typeFromMime(mime: string): SupportedImageType | null {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") return "jpeg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  return null;
}

function parseJpegDimensions(bytes: Uint8Array): ImageDimensions {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("JPEG marker 경계를 확인할 수 없습니다.");
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) throw new Error("JPEG marker가 잘렸습니다.");

    const marker = bytes[offset];
    offset += 1;
    if (marker === 0x00) throw new Error("JPEG marker가 올바르지 않습니다.");
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    ensureAvailable(bytes, offset, 2, "JPEG segment 길이가 잘렸습니다.");
    const segmentLength = readUint16Be(bytes, offset);
    if (segmentLength < 2) throw new Error("JPEG segment 길이가 올바르지 않습니다.");
    const segmentEnd = offset + segmentLength;
    if (segmentEnd > bytes.length) throw new Error("JPEG segment가 파일 경계를 벗어납니다.");

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 8) throw new Error("JPEG SOF segment가 너무 짧습니다.");
      const componentCount = bytes[offset + 7];
      if (componentCount === 0 || segmentLength !== 8 + componentCount * 3) {
        throw new Error("JPEG SOF component 정보가 올바르지 않습니다.");
      }
      return checkedDimensions(
        readUint16Be(bytes, offset + 5),
        readUint16Be(bytes, offset + 3),
        "JPEG",
      );
    }
    offset = segmentEnd;
  }
  throw new Error("JPEG SOF 크기 정보를 찾을 수 없습니다.");
}

function parsePngDimensions(bytes: Uint8Array): ImageDimensions {
  ensureAvailable(bytes, 0, 33, "PNG IHDR가 잘렸습니다.");
  if (readUint32Be(bytes, 8) !== 13 || !matchesAscii(bytes, 12, "IHDR")) {
    throw new Error("PNG의 첫 chunk가 올바른 IHDR가 아닙니다.");
  }
  return checkedDimensions(readUint32Be(bytes, 16), readUint32Be(bytes, 20), "PNG");
}

function parseWebpDimensions(bytes: Uint8Array): ImageDimensions {
  ensureAvailable(bytes, 0, 20, "WebP 컨테이너 헤더가 잘렸습니다.");
  const riffSize = readUint32Le(bytes, 4);
  if (riffSize < 12) throw new Error("WebP RIFF 크기가 올바르지 않습니다.");
  const containerEnd = 8 + riffSize;
  if (containerEnd > bytes.length) throw new Error("WebP RIFF 컨테이너가 잘렸습니다.");

  let offset = 12;
  while (offset < containerEnd) {
    ensureContainerAvailable(offset, 8, containerEnd, "WebP chunk 헤더가 잘렸습니다.");
    const chunkType = ascii(bytes, offset, 4);
    const chunkSize = readUint32Le(bytes, offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + chunkSize;
    const paddedEnd = dataEnd + (chunkSize % 2);
    if (!Number.isSafeInteger(dataEnd) || paddedEnd > containerEnd) {
      throw new Error("WebP chunk가 RIFF 경계를 벗어납니다.");
    }

    if (chunkType === "VP8X") {
      if (chunkSize !== 10) throw new Error("WebP VP8X header 크기가 올바르지 않습니다.");
      return checkedDimensions(
        1 + readUint24Le(bytes, dataOffset + 4),
        1 + readUint24Le(bytes, dataOffset + 7),
        "WebP VP8X",
      );
    }
    if (chunkType === "VP8L") {
      if (chunkSize < 5 || bytes[dataOffset] !== 0x2f) throw new Error("WebP VP8L header가 올바르지 않습니다.");
      const b1 = bytes[dataOffset + 1];
      const b2 = bytes[dataOffset + 2];
      const b3 = bytes[dataOffset + 3];
      const b4 = bytes[dataOffset + 4];
      return checkedDimensions(
        1 + b1 + ((b2 & 0x3f) << 8),
        1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
        "WebP VP8L",
      );
    }
    if (chunkType === "VP8 ") {
      if (
        chunkSize < 10 ||
        (bytes[dataOffset] & 1) !== 0 ||
        bytes[dataOffset + 3] !== 0x9d ||
        bytes[dataOffset + 4] !== 0x01 ||
        bytes[dataOffset + 5] !== 0x2a
      ) {
        throw new Error("WebP VP8 key frame header가 올바르지 않습니다.");
      }
      return checkedDimensions(
        readUint16Le(bytes, dataOffset + 6) & 0x3fff,
        readUint16Le(bytes, dataOffset + 8) & 0x3fff,
        "WebP VP8",
      );
    }
    offset = paddedEnd;
  }
  throw new Error("WebP 이미지 크기 chunk를 찾을 수 없습니다.");
}

function checkedDimensions(width: number, height: number, label: string): ImageDimensions {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`${label} 크기 정보가 올바르지 않습니다.`);
  }
  return { width, height };
}

function ensureAvailable(bytes: Uint8Array, offset: number, length: number, message: string): void {
  if (offset < 0 || length < 0 || offset + length > bytes.length) throw new Error(message);
}

function ensureContainerAvailable(offset: number, length: number, end: number, message: string): void {
  if (offset < 0 || length < 0 || offset + length > end) throw new Error(message);
}

function matchesAscii(bytes: Uint8Array, offset: number, expected: string): boolean {
  if (offset + expected.length > bytes.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected.charCodeAt(index)) return false;
  }
  return true;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  ensureAvailable(bytes, offset, length, "ASCII 필드가 잘렸습니다.");
  let value = "";
  for (let index = 0; index < length; index += 1) value += String.fromCharCode(bytes[offset + index]);
  return value;
}

function readUint16Be(bytes: Uint8Array, offset: number): number {
  ensureAvailable(bytes, offset, 2, "16-bit big-endian 필드가 잘렸습니다.");
  return bytes[offset] * 256 + bytes[offset + 1];
}

function readUint16Le(bytes: Uint8Array, offset: number): number {
  ensureAvailable(bytes, offset, 2, "16-bit little-endian 필드가 잘렸습니다.");
  return bytes[offset] + bytes[offset + 1] * 256;
}

function readUint24Le(bytes: Uint8Array, offset: number): number {
  ensureAvailable(bytes, offset, 3, "24-bit little-endian 필드가 잘렸습니다.");
  return bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65_536;
}

function readUint32Be(bytes: Uint8Array, offset: number): number {
  ensureAvailable(bytes, offset, 4, "32-bit big-endian 필드가 잘렸습니다.");
  return bytes[offset] * 16_777_216 + bytes[offset + 1] * 65_536 + bytes[offset + 2] * 256 + bytes[offset + 3];
}

function readUint32Le(bytes: Uint8Array, offset: number): number {
  ensureAvailable(bytes, offset, 4, "32-bit little-endian 필드가 잘렸습니다.");
  return bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65_536 + bytes[offset + 3] * 16_777_216;
}
