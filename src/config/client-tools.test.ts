import { describe, expect, it } from "vitest";
import { clientTools, getClientTool } from "./client-tools";
import { tools } from "./tools";

describe("client tool catalog", () => {
  it("keeps the navigation fields in sync with the full server catalog", () => {
    expect(clientTools).toEqual(tools.map((tool) => ({
      id: tool.id,
      slug: tool.slug,
      title: tool.title,
      displaySpec: tool.displaySpec,
      workspaceKind: tool.workspaceKind,
      nextToolIds: tool.nextToolIds,
    })));
  });

  it("resolves every next-tool relationship without importing server content", () => {
    for (const tool of clientTools) {
      for (const targetId of tool.nextToolIds) expect(getClientTool(targetId)).toBeDefined();
    }
  });
});
