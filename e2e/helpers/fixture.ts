import { deflateSync } from "node:zlib";

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function makePng(width = 640, height = 800, withPrivateMetadata = false): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 4;
      const center = Math.abs(x - width / 2) < width * 0.22 && y > height * 0.18 && y < height * 0.75;
      raw[offset] = center ? 211 : 238;
      raw[offset + 1] = center ? 150 : 242;
      raw[offset + 2] = center ? 118 : 246;
      raw[offset + 3] = 255;
    }
  }
  const chunks = [chunk("IHDR", header)];
  if (withPrivateMetadata) {
    chunks.push(chunk("tEXt", Buffer.from("Author\0QA Fixture Maker", "latin1")));
    chunks.push(chunk("tEXt", Buffer.from("Description\0Synthetic test image", "latin1")));
    chunks.push(chunk("tEXt", Buffer.from("Software\0PixelFit E2E", "latin1")));
  }
  chunks.push(chunk("IDAT", deflateSync(raw, { level: 6 })), chunk("IEND", Buffer.alloc(0)));
  return Buffer.concat([Buffer.from(PNG_SIGNATURE), ...chunks]);
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBytes.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return output;
}

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

export function readImageDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.subarray(1, 4).toString("ascii") === "PNG") return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
      }
      if (marker === 0xda || marker === 0xd9) break;
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2) break;
      offset += length + 2;
    }
  }
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    const chunk = bytes.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X" && bytes.length >= 30) {
      return {
        width: bytes.readUIntLE(24, 3) + 1,
        height: bytes.readUIntLE(27, 3) + 1,
      };
    }
    if (chunk === "VP8 " && bytes.length >= 30 && bytes.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const dimensions = bytes.readUInt32LE(21);
      return {
        width: (dimensions & 0x3fff) + 1,
        height: ((dimensions >>> 14) & 0x3fff) + 1,
      };
    }
  }
  throw new Error("image dimensions not found");
}

export function readImageFormat(bytes: Buffer): "jpeg" | "png" | "webp" {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from(PNG_SIGNATURE))) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  throw new Error("image format not found");
}
