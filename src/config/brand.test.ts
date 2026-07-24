import { describe, expect, it } from "vitest";
import { brand, publicPath, publicUrl } from "./brand";

describe("public URL helpers", () => {
  it("uses trailing slashes for exported pages", () => {
    expect(publicUrl("/privacy")).toBe(`${brand.url}/privacy/`);
    expect(publicUrl("/guide?from=home#start")).toBe(`${brand.url}/guide/?from=home#start`);
  });

  it("does not append a slash to public files", () => {
    expect(publicUrl("/sitemap.xml")).toBe(`${brand.url}/sitemap.xml`);
    expect(publicPath("/icon.svg")).toMatch(/\/icon\.svg$/u);
  });
});
