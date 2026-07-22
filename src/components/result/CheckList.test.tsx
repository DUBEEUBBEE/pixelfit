import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckList } from "./CheckList";

describe("CheckList", () => {
  it("communicates status with text as well as color", () => {
    render(<CheckList checks={[{ id: "size", level: "pass", label: "출력 픽셀", detail: "413×531px" }, { id: "review", level: "warning", label: "직접 확인", detail: "배경을 확인하세요." }, { id: "date", level: "info", label: "촬영일", detail: "자동 확인 불가" }]} />);
    expect(screen.getByText(/통과 · 출력 픽셀/)).toBeInTheDocument();
    expect(screen.getByText(/주의 · 직접 확인/)).toBeInTheDocument();
    expect(screen.getByText(/정보 · 촬영일/)).toBeInTheDocument();
  });
});
