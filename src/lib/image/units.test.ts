import { describe, expect, it } from "vitest";
import { cmToPixels } from "./units";

describe("cmToPixels", () => {
  it("converts conventional print sizes at 300dpi", () => {
    expect(cmToPixels(3, 300)).toBe(354);
    expect(cmToPixels(4, 300)).toBe(472);
    expect(cmToPixels(3.5, 300)).toBe(413);
    expect(cmToPixels(4.5, 300)).toBe(531);
  });

  it("rejects invalid values", () => {
    expect(() => cmToPixels(0, 300)).toThrow(RangeError);
    expect(() => cmToPixels(3, Number.NaN)).toThrow(RangeError);
  });
});
