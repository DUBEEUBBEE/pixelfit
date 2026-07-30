import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { tools } from "./tools";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ogImages = ["/og/home.png", ...tools.map((tool) => tool.seo.ogImage)];

describe("static Open Graph assets", () => {
  it("covers home and every tool with a unique file", () => {
    expect(tools).toHaveLength(14);
    expect(ogImages).toHaveLength(15);
    expect(new Set(ogImages).size).toBe(ogImages.length);
  });

  it.each(ogImages)("ships a valid 1200x630 PNG at %s", (assetPath) => {
    const filePath = path.join(process.cwd(), "public", assetPath.replace(/^\//u, ""));
    expect(fs.existsSync(filePath)).toBe(true);

    const contents = fs.readFileSync(filePath);
    expect(contents.length).toBeGreaterThan(10_000);
    expect(contents.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(contents.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect(contents.readUInt32BE(16)).toBe(1200);
    expect(contents.readUInt32BE(20)).toBe(630);
  });

  it("matches every home and tool PNG to the current Korean title generator", () => {
    expect(() => execFileSync(
      process.execPath,
      ["scripts/generate-og.mjs", "--check"],
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
    )).not.toThrow();
  }, 15_000);
});
