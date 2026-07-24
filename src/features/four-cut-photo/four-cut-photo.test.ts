import { describe, expect, it } from "vitest";
import { FOUR_CUT_SPECS, fourCutFilename, moveFourCutOrder } from ".";

describe("four-cut photo helpers", () => {
  it("uses explicit service preset dimensions", () => {
    expect(FOUR_CUT_SPECS.vertical).toMatchObject({ width: 1200, height: 1800 });
    expect(FOUR_CUT_SPECS.horizontal).toMatchObject({ width: 1800, height: 1200 });
  });

  it("provides keyboard-button reorder semantics without mutating state", () => {
    const original = [0, 1, 2, 3];
    expect(moveFourCutOrder(original, 1, -1)).toEqual([1, 0, 2, 3]);
    expect(moveFourCutOrder(original, 2, 1)).toEqual([0, 1, 3, 2]);
    expect(moveFourCutOrder(original, 0, -1)).toEqual(original);
    expect(original).toEqual([0, 1, 2, 3]);
  });

  it("keeps orientation, dimensions, and extension in the download filename", () => {
    expect(fourCutFilename("vertical", "jpeg")).toBe("four-cut-vertical-1200x1800.jpg");
    expect(fourCutFilename("horizontal", "png")).toBe("four-cut-horizontal-1800x1200.png");
  });
});
