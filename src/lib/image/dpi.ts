import { crc32 } from "./crc32";

const pngSignatureLength = 8;

export function setJpegDpi(input: Uint8Array, dpi: number): Uint8Array {
  if (input[0] !== 0xff || input[1] !== 0xd8) throw new Error("JPEG signature가 없습니다.");
  const density = Math.max(1, Math.min(65_535, Math.round(dpi)));
  let offset = 2;
  while (offset + 4 <= input.length && input[offset] === 0xff) {
    const marker = input[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (input[offset + 2] << 8) | input[offset + 3];
    if (length < 2 || offset + 2 + length > input.length) break;
    if (marker === 0xe0 && length >= 16 && ascii(input, offset + 4, 5) === "JFIF\0") {
      const output = input.slice();
      output[offset + 11] = 1;
      output[offset + 12] = density >>> 8;
      output[offset + 13] = density & 0xff;
      output[offset + 14] = density >>> 8;
      output[offset + 15] = density & 0xff;
      return output;
    }
    offset += 2 + length;
  }
  const segment = Uint8Array.from([
    0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x02, 0x01,
    density >>> 8, density & 0xff,
    density >>> 8, density & 0xff,
    0x00, 0x00,
  ]);
  const output = new Uint8Array(input.length + segment.length);
  output.set(input.subarray(0, 2));
  output.set(segment, 2);
  output.set(input.subarray(2), 2 + segment.length);
  return output;
}

export function readJpegDpi(input: Uint8Array): number | null {
  let offset = 2;
  while (offset + 16 <= input.length && input[offset] === 0xff) {
    const marker = input[offset + 1];
    if (marker === 0xda || marker === 0xd9) return null;
    const length = (input[offset + 2] << 8) | input[offset + 3];
    if (marker === 0xe0 && length >= 16 && ascii(input, offset + 4, 5) === "JFIF\0") {
      const units = input[offset + 11];
      const xDensity = (input[offset + 12] << 8) | input[offset + 13];
      if (units === 1) return xDensity;
      if (units === 2) return Math.round(xDensity * 2.54);
      return null;
    }
    if (length < 2) return null;
    offset += length + 2;
  }
  return null;
}

export function setPngDpi(input: Uint8Array, dpi: number): Uint8Array {
  if (ascii(input, 1, 3) !== "PNG") throw new Error("PNG signature가 없습니다.");
  const ppm = Math.round(dpi / 0.0254);
  const data = new Uint8Array(9);
  const view = new DataView(data.buffer);
  view.setUint32(0, ppm);
  view.setUint32(4, ppm);
  data[8] = 1;
  const chunk = makePngChunk("pHYs", data);
  const parts: Uint8Array[] = [input.subarray(0, pngSignatureLength)];
  let offset = pngSignatureLength;
  let inserted = false;
  while (offset + 12 <= input.length) {
    const length = readUint32(input, offset);
    const type = ascii(input, offset + 4, 4);
    const end = offset + 12 + length;
    if (end > input.length) throw new Error("손상된 PNG chunk입니다.");
    if (type === "pHYs") {
      if (!inserted) { parts.push(chunk); inserted = true; }
    } else {
      if ((type === "IDAT" || type === "IEND") && !inserted) { parts.push(chunk); inserted = true; }
      parts.push(input.subarray(offset, end));
    }
    offset = end;
    if (type === "IEND") break;
  }
  return concat(parts);
}

export function readPngDpi(input: Uint8Array): number | null {
  let offset = pngSignatureLength;
  while (offset + 12 <= input.length) {
    const length = readUint32(input, offset);
    const type = ascii(input, offset + 4, 4);
    if (type === "pHYs" && length === 9 && input[offset + 16] === 1) {
      return Math.round(readUint32(input, offset + 8) * 0.0254);
    }
    offset += length + 12;
  }
  return null;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
