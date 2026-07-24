import { describe, expect, it } from "vitest";
import { calculateFitPlan, estimateResizedBytes, isUpscale, resolveResizeDimensions, validateResizeDimensions } from "./resize";

describe("resize math", () => {
  const source = { width: 4000, height: 3000 };

  it("locks aspect ratio from the last edited dimension", () => {
    expect(resolveResizeDimensions(source, { mode: "dimensions", width: 1000, height: 10, ratioLocked: true, anchor: "width" })).toEqual({ width: 1000, height: 750 });
    expect(resolveResizeDimensions(source, { mode: "dimensions", width: 10, height: 600, ratioLocked: true, anchor: "height" })).toEqual({ width: 800, height: 600 });
  });

  it("resolves long-edge and percent modes", () => {
    expect(resolveResizeDimensions(source, { mode: "long-edge", longEdge: 1200 })).toEqual({ width: 1200, height: 900 });
    expect(resolveResizeDimensions(source, { mode: "percent", percent: 25 })).toEqual({ width: 1000, height: 750 });
  });

  it("calculates contain and cover plans without distortion", () => {
    const contain = calculateFitPlan({ width: 1600, height: 900 }, { width: 1000, height: 1000 }, "contain");
    expect(contain.destination).toEqual({ x: 0, y: 218.75, width: 1000, height: 562.5 });
    const cover = calculateFitPlan({ width: 1600, height: 900 }, { width: 1000, height: 1000 }, "cover");
    expect(cover.source.width).toBe(900);
    expect(cover.source.x).toBe(350);
  });

  it("warns about upscale and rejects unsafe output sizes", () => {
    expect(isUpscale({ width: 800, height: 600 }, { width: 801, height: 600 })).toBe(true);
    expect(() => validateResizeDimensions({ width: 20_000, height: 100 })).toThrow(/한 변/);
    expect(() => validateResizeDimensions({ width: 10_000, height: 10_000 })).toThrow(/픽셀/);
  });

  it("produces a bounded byte estimate", () => {
    expect(estimateResizedBytes(4_000_000, source, { width: 2000, height: 1500 })).toBe(1_000_000);
  });
});
