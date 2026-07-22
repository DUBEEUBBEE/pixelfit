import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { presets } from "@/lib/presets";
import { ToolSearch } from "./ToolSearch";

describe("ToolSearch", () => {
  it("filters by Korean search terms", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} />);
    expect(screen.getAllByRole("article")).toHaveLength(6);
    await user.type(screen.getByLabelText("도구 검색"), "위치정보");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /사진 개인정보/ })).toBeInTheDocument();
  });

  it("shows an actionable empty state", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} />);
    await user.type(screen.getByLabelText("도구 검색"), "없는도구");
    expect(screen.getByText(/다시 검색/)).toBeInTheDocument();
  });
});
