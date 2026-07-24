import { describe, expect, it } from "vitest";
import { calculateCropPreviewLayout } from "./preview";

describe("creative crop preview geometry", () => {
  it("does not invent movement when cover has no horizontal overflow", () => {
    const layout = calculateCropPreviewLayout(
      { width: 4000, height: 3000 },
      { width: 1600, height: 900 },
      { zoom: 1, offsetX: 1, offsetY: -1, rotation: 0 },
    );
    expect(layout.leftPercent).toBe(50);
    expect(layout.topPercent).toBeCloseTo(33.333, 2);
    expect(layout.widthPercent).toBe(100);
    expect(layout.heightPercent).toBeCloseTo(133.333, 2);
  });

  it("matches cover zoom, bounded offsets, and rotation semantics", () => {
    const layout = calculateCropPreviewLayout(
      { width: 1200, height: 1800 },
      { width: 1080, height: 1080 },
      { zoom: 2, offsetX: 2, offsetY: -2, rotation: 90 },
    );
    expect(layout.leftPercent).toBeCloseTo(150);
    expect(layout.topPercent).toBe(0);
    expect(layout.rotationDegrees).toBe(90);
  });
});
