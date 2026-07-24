import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildSocialImageZip, socialOutputFilename } from ".";

describe("social image pack", () => {
  it("uses deterministic filenames for every ratio", () => {
    expect(socialOutputFilename("square", "jpeg")).toBe("pixelfit-social-1x1-1080x1080.jpg");
    expect(socialOutputFilename("portrait", "png")).toBe("pixelfit-social-4x5-1080x1350.png");
    expect(socialOutputFilename("story", "jpeg")).toBe("pixelfit-social-9x16-1080x1920.jpg");
  });

  it("packages only selected non-empty results", async () => {
    const blob = await buildSocialImageZip([
      { id: "square", label: "square", filename: "square.jpg", blob: new Blob(["a"]), format: "jpeg", width: 1080, height: 1080 },
      { id: "story", label: "story", filename: "story.jpg", blob: new Blob(["b"]), format: "jpeg", width: 1080, height: 1920 },
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(["square.jpg", "story.jpg"]);
  });
});
