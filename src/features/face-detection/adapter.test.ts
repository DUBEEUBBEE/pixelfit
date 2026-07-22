import { describe, expect, it } from "vitest";
import { suggestTransformFromFace } from "./adapter";

describe("face crop suggestion", () => {
  it("centers a face without changing aspect ratio", () => {
    const result = suggestTransformFromFace({ x: 50, y: 80, width: 100, height: 120 }, 400, 600);
    expect(result.offsetX).toBeGreaterThan(0);
    expect(result.zoom).toBeGreaterThanOrEqual(1);
    expect(result.zoom).toBeLessThanOrEqual(2.4);
  });
});
