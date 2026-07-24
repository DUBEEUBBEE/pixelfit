import { describe, expect, it } from "vitest";
import { planPreviewDimensions, PREVIEW_MAX_EDGE, PREVIEW_MAX_PIXELS } from "./preview";

describe("bounded image previews", () => {
  it("keeps small images and bounds large previews without changing their ratio", () => {
    expect(planPreviewDimensions({ width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
    const large = planPreviewDimensions({ width: 8000, height: 5000 });
    expect(Math.max(large.width, large.height)).toBeLessThanOrEqual(PREVIEW_MAX_EDGE);
    expect(large.width * large.height).toBeLessThanOrEqual(PREVIEW_MAX_PIXELS);
    expect(large.width / large.height).toBeCloseTo(8 / 5, 2);
  });
});
