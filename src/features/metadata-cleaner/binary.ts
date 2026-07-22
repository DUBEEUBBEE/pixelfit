import { MetadataCleanerError } from "./types";

const LATIN1 = new TextDecoder("latin1");
const UTF8 = new TextDecoder("utf-8", { fatal: false });

export function malformed(message: string): never {
  throw new MetadataCleanerError("MALFORMED_IMAGE", message);
}

export function ensureRange(
  bytes: Uint8Array,
  offset: number,
  length: number,
  message: string,
): void {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset > bytes.length - length
  ) {
    malformed(message);
  }
}

export function readUint16BE(bytes: Uint8Array, offset: number): number {
  ensureRange(bytes, offset, 2, "Truncated 16-bit big-endian value.");
  return bytes[offset] * 0x100 + bytes[offset + 1];
}

export function readUint32BE(bytes: Uint8Array, offset: number): number {
  ensureRange(bytes, offset, 4, "Truncated 32-bit big-endian value.");
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

export function readUint32LE(bytes: Uint8Array, offset: number): number {
  ensureRange(bytes, offset, 4, "Truncated 32-bit little-endian value.");
  return (
    bytes[offset] +
    bytes[offset + 1] * 0x100 +
    bytes[offset + 2] * 0x10000 +
    bytes[offset + 3] * 0x1000000
  );
}

export function writeUint32BE(bytes: Uint8Array, offset: number, value: number): void {
  ensureRange(bytes, offset, 4, "Cannot write a 32-bit big-endian value.");
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

export function writeUint32LE(bytes: Uint8Array, offset: number, value: number): void {
  ensureRange(bytes, offset, 4, "Cannot write a 32-bit little-endian value.");
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

export function ascii(bytes: Uint8Array, offset = 0, length = bytes.length - offset): string {
  ensureRange(bytes, offset, length, "Cannot decode bytes outside the buffer.");
  // The WHATWG latin1 decoder is byte-for-code-point, so ASCII searches keep
  // stable byte offsets without an O(n²) string concatenation loop.
  return LATIN1.decode(bytes.subarray(offset, offset + length));
}

export function latin1(bytes: Uint8Array): string {
  return LATIN1.decode(bytes);
}

export function utf8(bytes: Uint8Array): string {
  return UTF8.decode(bytes);
}

export function startsWithBytes(
  bytes: Uint8Array,
  expected: readonly number[],
  offset = 0,
): boolean {
  if (offset < 0 || offset + expected.length > bytes.length) {
    return false;
  }
  return expected.every((value, index) => bytes[offset + index] === value);
}

export function startsWithAscii(bytes: Uint8Array, expected: string, offset = 0): boolean {
  if (offset < 0 || offset + expected.length > bytes.length) {
    return false;
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected.charCodeAt(index)) {
      return false;
    }
  }
  return true;
}

export function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

export function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

export function fingerprintBytes(bytes: Uint8Array): string {
  // Two independent 32-bit accumulators keep invariant reports compact even for
  // large profiles while avoiding a full binary-to-string copy.
  let fnv = 0x811c9dc5;
  let mix = 0x9e3779b9;
  for (const byte of bytes) {
    fnv = Math.imul(fnv ^ byte, 0x01000193) >>> 0;
    mix = (Math.imul(mix ^ (byte + 0x9d), 0x85ebca6b) + 0xc2b2ae35) >>> 0;
  }
  return `${bytes.length}:${fnv.toString(16)}:${mix.toString(16)}`;
}

export function uniqueBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const itemKey = key(item);
    if (seen.has(itemKey)) {
      return false;
    }
    seen.add(itemKey);
    return true;
  });
}
