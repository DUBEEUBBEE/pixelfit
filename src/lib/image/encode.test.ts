import { describe, expect, it } from "vitest";
import {
  assertEncodedSignature,
  clampEncodeQuality,
  extensionForOutputFormat,
  mimeForOutputFormat,
  normalizeCanvasColor,
} from "./encode";

describe("image encoder helpers", () => {
  it("maps supported output formats without guessing extensions", () => {
    expect(mimeForOutputFormat("jpeg")).toBe("image/jpeg");
    expect(mimeForOutputFormat("png")).toBe("image/png");
    expect(mimeForOutputFormat("webp")).toBe("image/webp");
    expect(extensionForOutputFormat("jpeg")).toBe("jpg");
  });

  it("clamps lossy quality and validates background colors", () => {
    expect(clampEncodeQuality(4)).toBe(1);
    expect(clampEncodeQuality(-1)).toBe(0.05);
    expect(clampEncodeQuality(undefined)).toBe(0.9);
    expect(normalizeCanvasColor("#Aa00fF")).toBe("#aa00ff");
    expect(normalizeCanvasColor("red")).toBe("#ffffff");
  });

  it("checks actual image signatures instead of trusting MIME", () => {
    expect(assertEncodedSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb]), "jpeg")).toBe("jpeg");
    expect(assertEncodedSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "png")).toBe("png");
    const webp = new Uint8Array(12);
    webp.set(new TextEncoder().encode("RIFF"), 0);
    webp.set(new TextEncoder().encode("WEBP"), 8);
    expect(assertEncodedSignature(webp, "webp")).toBe("webp");
    expect(() => assertEncodedSignature(webp, "png")).toThrow(/대신 WEBP/);
  });
});
