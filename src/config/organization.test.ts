import { describe, expect, it } from "vitest";
import { publicUrl } from "./brand";
import { buildOrganizationStructuredData } from "./organization";

describe("organization structured data", () => {
  it("uses one truthful public identity for nested and standalone JSON-LD", () => {
    const nested = buildOrganizationStructuredData();
    const standalone = buildOrganizationStructuredData({ includeContext: true });

    expect(nested).toMatchObject({
      "@type": "Organization",
      name: "픽셀핏",
      alternateName: "PixelFit",
      url: publicUrl("/"),
      email: "wodnd0823@gmail.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "wodnd0823@gmail.com",
        availableLanguage: ["Korean"],
      },
    });
    expect(nested).not.toHaveProperty("@context");
    expect(standalone["@context"]).toBe("https://schema.org");
    expect(standalone.url).toBe(publicUrl("/"));
    expect(JSON.stringify(standalone)).not.toMatch(/address|telephone|foundingDate/u);
  });
});
