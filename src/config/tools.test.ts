import { describe, expect, it } from "vitest";
import { getTool, homeCategories, tools } from "./tools";

describe("tool catalog", () => {
  it("13개 실제 도구를 고유 경로와 편집기 종류로 등록한다", () => {
    expect(tools).toHaveLength(13);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(13);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(13);
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
});
