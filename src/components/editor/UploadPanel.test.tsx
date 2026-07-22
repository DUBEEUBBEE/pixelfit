import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadPanel } from "./UploadPanel";

describe("UploadPanel", () => {
  it("has an accessible input and forwards a selected file", async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "portrait.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("사진 또는 파일 선택"), file);
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("announces a useful error", () => {
    render(<UploadPanel onFile={() => undefined} error="사진을 읽을 수 없습니다. JPEG 파일을 다시 선택해 주세요." />);
    expect(screen.getByRole("alert")).toHaveTextContent("다시 선택");
  });
});
