import { describe, expect, it } from "vitest";
import { calculateContainScale, calculateCoverTransform, defaultCropTransform, rotatePoint, scaleSafeArea } from "./geometry";

describe("image geometry", () => {
  it("covers output without empty edges", () => {
    const transform = calculateCoverTransform(1200, 800, 413, 531, defaultCropTransform);
    expect(transform.renderedWidth).toBeGreaterThanOrEqual(413);
    expect(transform.renderedHeight).toBeGreaterThanOrEqual(531);
    expect(transform.scale).toBeCloseTo(531 / 800);
  });

  it("contains wide images", () => {
    expect(calculateContainScale(1600, 900, 800, 800)).toBe(0.5);
  });

  it("rotates coordinates", () => {
    expect(rotatePoint(10, 20, 100, 200, 90)).toEqual({ x: 180, y: 10 });
    expect(rotatePoint(10, 20, 100, 200, 180)).toEqual({ x: 90, y: 180 });
  });

  it("scales the YouTube minimum safe area to 2560x1440", () => {
    expect(scaleSafeArea(2560, 1440)).toEqual({ width: 1544, height: 423, left: 508, top: 509 });
  });
});
