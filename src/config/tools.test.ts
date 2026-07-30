import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTool, homeCategories, tools } from "./tools";
import { toolBadgeCopy } from "./tool-badges";

describe("tool catalog", () => {
  it("14개 실제 도구를 고유 경로와 편집기 종류로 등록한다", () => {
    expect(tools).toHaveLength(14);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(14);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(14);
    expect(tools.every((tool) => tool.workspaceKind.length > 0)).toBe(true);
  });

  it("SEO 제목과 설명을 도구별로 고유하게 유지한다", () => {
    expect(new Set(tools.map((tool) => tool.seo.title)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.seo.description)).size).toBe(tools.length);
    expect(tools.every((tool) => !tool.seo.title.includes("자동 제작"))).toBe(true);
  });

  it("명시한 다음 도구가 모두 존재하고 자기 참조하지 않는다", () => {
    for (const tool of tools) {
      expect(tool.nextToolIds).not.toContain(tool.id);
      for (const target of tool.nextToolIds) expect(getTool(target)).toBeDefined();
    }
  });

  it("홈 카테고리가 모든 도구를 빠짐없이 분류한다", () => {
    const categoryIds = new Set(homeCategories.map((category) => category.id));
    expect(tools.every((tool) => categoryIds.has(tool.category))).toBe(true);
  });

  it("모든 사용 사례에 고유한 제목과 설명을 제공한다", () => {
    for (const tool of tools) {
      expect(tool.content.useCases.length).toBeGreaterThanOrEqual(2);
      expect(new Set(tool.content.useCases.map((item) => item.description)).size).toBe(tool.content.useCases.length);
      for (const useCase of tool.content.useCases) {
        expect(useCase.title.length).toBeGreaterThanOrEqual(4);
        expect(useCase.description.length).toBeGreaterThanOrEqual(20);
        expect(useCase.description).not.toBe(tool.shortDescription);
      }
    }
  });

  it("도구 성격에 맞는 사용자 배지를 따로 관리한다", () => {
    const expected = {
      "passport-photo": "official-standard",
      "resident-id-photo": "official-standard",
      "id-photo": "common-photo-size",
      "youtube-banner": "official-reference",
      "youtube-thumbnail": "official-reference",
      "image-compressor": "utility",
      "image-resizer": "utility",
      "image-converter": "utility",
      "social-image-pack": "service-size",
      "instagram-profile-picture": "service-size",
      "four-cut-photo": "creative",
      "film-photo": "creative",
      "photo-privacy-cleaner": "privacy",
      "favicon-maker": "web",
    } as const;

    for (const tool of tools) {
      expect(tool.badgeKind).toBe(expected[tool.id as keyof typeof expected]);
      expect(toolBadgeCopy[tool.badgeKind].length).toBeGreaterThan(3);
    }
    expect(toolBadgeCopy[getTool("image-compressor")!.badgeKind]).toBe("일상 이미지 도구");
    expect(toolBadgeCopy[getTool("film-photo")!.badgeKind]).toBe("감성 프리셋");
  });

  it("각 도구가 게시일과 수정일을 보유하고 전역 날짜 상수를 사용하지 않는다", () => {
    for (const tool of tools) {
      expect(tool.seo.contentPublishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(tool.seo.contentUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(tool.seo.contentUpdatedAt >= tool.seo.contentPublishedAt).toBe(true);
      expect(tool.heroFacts).toHaveLength(2);
    }
    const source = readFileSync(path.join(process.cwd(), "src/config/tools.ts"), "utf8");
    expect(source).not.toMatch(/const\s+(?:updatedAt|contentUpdatedAt)\s*=/u);
  });
});
