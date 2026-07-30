import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { toToolSearchSummary } from "@/config/client-tools";
import { homeCategories, tools } from "@/config/tools";
import { ToolSearch } from "./ToolSearch";

describe("ToolSearch", () => {
  const presets = tools.map(toToolSearchSummary);

  it("starts with four frequent tools instead of expanding all thirteen", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);

    expect(screen.getByPlaceholderText("500KB, 크기 조절, JPG 변환, 유튜브, 네컷…")).toBeInTheDocument();
    const featured = screen.getByRole("region", { name: "자주 쓰는 도구" });
    expect(within(featured).getAllByRole("article")).toHaveLength(4);
    for (const title of ["사진 용량 줄이기", "이미지 크기 조절", "이미지 형식 변환", "SNS 이미지 세트"]) {
      expect(within(featured).getByRole("heading", { name: title })).toBeInTheDocument();
    }

    const allTools = screen.getByText("전체 도구 14개 보기").closest("details");
    expect(allTools).not.toHaveAttribute("open");
    await user.click(screen.getByText("전체 도구 14개 보기"));
    expect(allTools).toHaveAttribute("open");
    expect(within(allTools as HTMLElement).getAllByRole("article")).toHaveLength(14);
  });

  it("filters by Korean search terms", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.type(screen.getByLabelText("도구 검색"), "위치정보");
    const results = screen.getByRole("region", { name: "검색 결과" });
    expect(within(results).getAllByRole("article")).toHaveLength(1);
    expect(within(results).getByRole("heading", { name: /사진 개인정보/ })).toBeInTheDocument();
  });

  it("shows an actionable empty state", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.type(screen.getByLabelText("도구 검색"), "없는도구");
    expect(screen.getByText(/다시 검색/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "사진 용량 줄이기" })).toBeInTheDocument();
  });

  it("runs practical quick searches and multi-word matching", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.click(screen.getByRole("button", { name: "JPG 변환" }));
    expect(screen.getByLabelText("도구 검색")).toHaveValue("JPG 변환");
    expect(screen.getByRole("button", { name: "JPG 변환" })).toHaveAttribute("aria-pressed", "true");
    const results = screen.getByRole("region", { name: "검색 결과" });
    expect(within(results).getByRole("heading", { name: "이미지 형식 변환" })).toBeInTheDocument();
  });

  it("shows only the selected category", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.click(screen.getByRole("button", { name: "공식 사진" }));
    expect(screen.getByRole("button", { name: "공식 사진" })).toHaveAttribute("aria-pressed", "true");
    const category = screen.getByRole("region", { name: "공식 사진" });
    expect(within(category).getAllByRole("article")).toHaveLength(3);
  });

  it("recognizes practical aliases", async () => {
    const user = userEvent.setup();
    render(<ToolSearch presets={presets} categories={homeCategories} />);
    await user.type(screen.getByLabelText("도구 검색"), "쇼츠");
    expect(screen.getByRole("heading", { name: "SNS 이미지 세트" })).toBeInTheDocument();
  });
});
