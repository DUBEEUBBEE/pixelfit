import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { toToolSearchSummary } from "@/config/client-tools";
import { homeCategories, tools } from "@/config/tools";
import { ToolSearch } from "./ToolSearch";

describe("ToolSearch", () => {
  const presets = tools.map(toToolSearchSummary);

  it("filters by Korean search terms", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    expect(screen.getAllByRole("article")).toHaveLength(13);
    await user.type(screen.getByLabelText("도구 검색"), "위치정보");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /사진 개인정보/ })).toBeInTheDocument();
  });

  it("shows an actionable empty state", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.type(screen.getByLabelText("도구 검색"), "없는도구");
    expect(screen.getByText(/다시 검색/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "사진 용량 줄이기" })).toBeInTheDocument();
  });

  it("recognizes practical aliases", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.type(screen.getByLabelText("도구 검색"), "쇼츠");
    expect(screen.getByRole("heading", { name: "SNS 이미지 세트" })).toBeInTheDocument();
  });
});
