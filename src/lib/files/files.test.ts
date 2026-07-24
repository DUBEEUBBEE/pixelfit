import { describe, expect, it } from "vitest";
import { detectImageType } from "./signatures";
import { createOutputFilename } from "./names";
import { formatBytes, MAX_IMAGE_EDGE, validatePixelCount } from "./validation";

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
