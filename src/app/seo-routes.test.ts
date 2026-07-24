import { describe, expect, it } from "vitest";
import { guides } from "@/config/guides";
import { tools } from "@/config/tools";
import robots from "./robots";
import sitemap from "./sitemap";

describe("static SEO routes", () => {
  it("홈·신뢰 페이지·13개 도구·8개 가이드를 url과 수정일만으로 싣는다", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(6 + tools.length + guides.length);
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual(["lastModified", "url"]);
      expect(entry.lastModified).toMatch(/^2026-\d{2}-\d{2}$/u);
      expect(new URL(entry.url).search).toBe("");
      expect(new URL(entry.url).hash).toBe("");
    }
    expect(entries.some((entry) => entry.url.includes("404"))).toBe(false);
  });

  it("robots에 절대 sitemap을 쓰고 project path를 잃는 Host를 만들지 않는다", () => {
    const value = robots();
    expect(value.sitemap).toMatch(/^https:\/\//u);
    expect(value).not.toHaveProperty("host");
  });
});
