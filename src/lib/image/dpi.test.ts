import { describe, expect, it } from "vitest";
import { crc32 } from "./crc32";
import { readJpegDpi, readPngDpi, setJpegDpi, setPngDpi } from "./dpi";

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const bytes = new Uint8Array(data.length + 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  bytes.set(typeBytes, 4);
  bytes.set(data, 8);
  view.setUint32(bytes.length - 4, crc32(bytes.subarray(4, bytes.length - 4)));
  return bytes;
}

function pngFixture(): Uint8Array {
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const iend = chunk("IEND", new Uint8Array());
  return Uint8Array.from([...signature, ...chunk("IHDR", ihdr), ...iend]);
}

describe("DPI metadata", () => {
  it("writes and parses a JFIF density", () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    const output = setJpegDpi(jpeg, 300);
    expect(readJpegDpi(output)).toBe(300);
    expect(output.at(-2)).toBe(0xff);
  });

  it("writes and parses a PNG pHYs chunk", () => {
    const output = setPngDpi(pngFixture(), 300);
    expect(readPngDpi(output)).toBe(300);
    expect(new TextDecoder().decode(output)).toContain("pHYs");
  });
});
