import { describe, expect, it } from "vitest";
import { nextCompressionDimensions, targetSizeToBytes } from "./compress";

describe("image compressor planning", () => {
  it("converts explicit KB and MB targets", () => {
    expect(targetSizeToBytes(500, "KB")).toBe(512_000);
    expect(targetSizeToBytes(1, "MB")).toBe(1_048_576);
    expect(() => targetSizeToBytes(0, "KB")).toThrow(/0보다/);
  });

  it("uses a bounded area-based downscale and preserves aspect ratio", () => {
    const next = nextCompressionDimensions({ width: 4000, height: 3000 }, 4_000_000, 1_000_000);
    expect(next).toEqual({ width: 1840, height: 1380 });
    expect(next.width / next.height).toBeCloseTo(4 / 3);
    const bounded = nextCompressionDimensions({ width: 100, height: 50 }, 10_000_000, 1000);
    expect(bounded.width).toBeGreaterThanOrEqual(32);
    expect(bounded.height).toBeGreaterThanOrEqual(32);

    const thin = nextCompressionDimensions({ width: 1000, height: 10 }, 10_000_000, 1000);
    expect(thin).toEqual({ width: 1000, height: 10 });
  });
});
