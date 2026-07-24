import { describe, expect, it } from "vitest";
import { canPreserveMetadataExactly, converterOutputFilename } from "./convert";

describe("image converter policy", () => {
  it("allows exact metadata preservation only without changing containers", () => {
    expect(canPreserveMetadataExactly("jpeg", "jpeg")).toBe(true);
    expect(canPreserveMetadataExactly("png", "webp")).toBe(false);
    expect(canPreserveMetadataExactly("webp", "jpeg")).toBe(false);
  });

  it("creates predictable safe output names", () => {
    expect(converterOutputFilename("jpeg")).toBe("pixelfit-converted.jpg");
    expect(converterOutputFilename("webp")).toBe("pixelfit-converted.webp");
  });
});
