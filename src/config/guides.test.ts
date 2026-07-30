import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getGuide, guides } from "./guides";

const expectedSlugs = [
  "passport-photo-413x531",
  "photo-under-500kb",
  "id-photo-size",
  "dpi-vs-pixels",
  "youtube-banner-safe-area",
  "favicon-files",
  "exif-photo-privacy",
  "jpeg-png-webp",
];

function readPngSize(filePath: string): { width: number; height: number } {
  const bytes = readFileSync(filePath);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("guide registry", () => {
  it("contains the eight requested unique routes", () => {
    expect(guides.map((guide) => guide.slug)).toEqual(expectedSlugs);
    expect(new Set(guides.map((guide) => guide.slug)).size).toBe(guides.length);
    expect(expectedSlugs.every((slug) => getGuide(slug)?.slug === slug)).toBe(true);
  });

  it("keeps SEO copy, source verification, and content dates explicit", () => {
    expect(new Set(guides.map((guide) => guide.seo.title)).size).toBe(guides.length);
    expect(new Set(guides.map((guide) => guide.seo.description)).size).toBe(guides.length);
    expect(new Set(guides.map((guide) => guide.seo.ogImage)).size).toBe(guides.length);

    for (const guide of guides) {
      expect(guide.seo.title).not.toMatch(/자동 제작/);
      expect(guide.seo.description.length).toBeGreaterThan(50);
      expect(guide.seo.contentPublishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.seo.contentUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.seo.contentUpdatedAt >= guide.seo.contentPublishedAt).toBe(true);
      expect(guide.source.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new URL(guide.source.url).protocol).toBe("https:");
      expect(guide.source.title.length).toBeGreaterThan(3);
    }
    const source = readFileSync(path.join(process.cwd(), "src/config/guides.ts"), "utf8");
    expect(source).not.toMatch(/const\s+(?:contentPublishedAt|contentUpdatedAt)\s*=/u);
  });

  it("uses reader-facing language and records the copy revision without changing publication dates", () => {
    const visibleCopy = JSON.stringify(guides);
    expect(visibleCopy).not.toMatch(/\b(?:Blob|payload|parse|magic bytes|container|signature|MIME)\b/iu);
    expect(visibleCopy).not.toMatch(/파싱|페이로드|컨테이너|시그니처/u);

    for (const guide of guides) {
      expect(guide.seo.contentPublishedAt).toBe("2026-07-23");
      expect(guide.seo.contentUpdatedAt).toBe("2026-07-26");
    }
  });

  it("provides accessible article structure, examples, CTAs, and valid related guides", () => {
    const knownSlugs = new Set(guides.map((guide) => guide.slug));
    for (const guide of guides) {
      expect(guide.sections.length).toBeGreaterThanOrEqual(3);
      expect(guide.problem.length).toBeGreaterThan(30);
      expect(new Set(guide.sections.map((section) => section.id)).size).toBe(guide.sections.length);
      expect(guide.example.rows.length).toBeGreaterThanOrEqual(3);
      expect(guide.toolCtas.length).toBeGreaterThan(0);
      expect(guide.toolCtas.every((cta) => cta.href.startsWith("/"))).toBe(true);
      expect(guide.relatedGuideSlugs.length).toBeGreaterThanOrEqual(2);
      expect(guide.relatedGuideSlugs).not.toContain(guide.slug);
      expect(guide.relatedGuideSlugs.every((slug) => knownSlugs.has(slug))).toBe(true);
    }
  });

  it("ships every referenced OG image as a real 1200x630 PNG", () => {
    for (const guide of guides) {
      expect(guide.seo.ogImage.endsWith(".png")).toBe(true);
      const filePath = path.join(process.cwd(), "public", guide.seo.ogImage.replace(/^\//, ""));
      expect(readPngSize(filePath)).toEqual({ width: 1200, height: 630 });
    }
    expect(readPngSize(path.join(process.cwd(), "public/og/guides/index.png"))).toEqual({ width: 1200, height: 630 });
  });

  it("does not emit deprecated FAQPage structured data", () => {
    const articleSource = readFileSync(path.join(process.cwd(), "src/components/content/GuideArticle.tsx"), "utf8");
    expect(articleSource).not.toContain("FAQPage");
  });
});
