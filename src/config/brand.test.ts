import { describe, expect, it } from "vitest";
import { brand, publicPath, publicUrl } from "./brand";

describe("public URL helpers", () => {
  it("uses the real public identity and email fallback", () => {
    expect(brand).toMatchObject({
      name: "픽셀핏",
      alternateName: "PixelFit",
      operatorName: "DUBEEUBBEE",
      contactEmail: "wodnd0823@gmail.com",
      contactHref: "mailto:wodnd0823@gmail.com",
    });
  });

  it("uses trailing slashes for exported pages", () => {
    expect(publicUrl("/privacy")).toBe(`${brand.url}/privacy/`);
    expect(publicUrl("/guide?from=home#start")).toBe(`${brand.url}/guide/?from=home#start`);
  });

  it("does not append a slash to public files", () => {
    expect(publicUrl("/sitemap.xml")).toBe(`${brand.url}/sitemap.xml`);
    expect(publicPath("/icon.svg")).toMatch(/\/icon\.svg$/u);
  });
});
