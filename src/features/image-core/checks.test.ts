import { describe, expect, it } from "vitest";
import { buildPhotoChecks } from "./checks";

describe("result check levels", () => {
  it("uses text levels and never treats unavailable face checks as pass", () => {
    const checks = buildPhotoChecks({ width: 413, height: 531, expectedWidth: 413, expectedHeight: 531, bytes: 100_000, maxBytes: 500_000, sourceWidth: 1200, sourceHeight: 1600, official: true, faceStatus: "unsupported" });
    expect(checks.find((check) => check.id === "dimensions")?.level).toBe("pass");
    expect(checks.find((check) => check.id === "face")?.level).toBe("warning");
    expect(checks.at(-1)?.level).toBe("info");
  });
});
