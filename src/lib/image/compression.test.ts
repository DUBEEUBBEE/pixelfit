import { describe, expect, it } from "vitest";
import { compressToTarget } from "./compression";

describe("compression quality search", () => {
  it("finds the highest useful quality under the target with bounded attempts", async () => {
    const result = await compressToTarget(async (quality) => new Blob([new Uint8Array(Math.round(quality * 1000))]), 700);
    expect(result.reachedTarget).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(700);
    expect(result.quality).toBeGreaterThan(0.65);
    expect(result.attempts).toBeLessThanOrEqual(9);
  });

  it("reports an unreachable target instead of looping", async () => {
    const result = await compressToTarget(async () => new Blob([new Uint8Array(1000)]), 100);
    expect(result.reachedTarget).toBe(false);
    expect(result.attempts).toBeLessThanOrEqual(9);
  });
});
