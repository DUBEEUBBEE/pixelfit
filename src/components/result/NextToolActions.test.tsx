import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ImageTransferProvider } from "@/components/session/ImageTransferProvider";
import { NextToolActions } from "./NextToolActions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("NextToolActions", () => {
  afterEach(() => {
    push.mockReset();
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
  });

  it("설명과 함께 사용자가 선택한 때에만 다음 도구로 이동한다", () => {
    render(
      <ImageTransferProvider>
        <NextToolActions
          sourceToolId="image-compressor"
          targetIds={["image-resizer", "image-converter"]}
          asset={new Blob(["result"], { type: "image/jpeg" })}
          filename="private-face.jpg"
        />
      </ImageTransferProvider>,
    );

    expect(screen.getByRole("heading", { name: "같은 사진으로 이어서 만들기" })).toBeInTheDocument();
    expect(screen.getByText(/버튼을 누를 때만 현재 탭 메모리/u)).toBeInTheDocument();
    expect(screen.getByText("현재 사진으로 원하는 가로·세로 픽셀을 만듭니다.")).toBeInTheDocument();
    expect(screen.queryByText(/같은 원본/u)).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /이미지 크기 조절/u }));
    expect(push).toHaveBeenCalledWith("/image-resizer");
  });

  it("파일 공유가 가능한 감성 도구에서만 안전한 이름으로 Web Share를 호출한다", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn(() => true) });

    render(
      <ImageTransferProvider>
        <NextToolActions
          sourceToolId="film-photo"
          targetIds={["four-cut-photo"]}
          asset={new Blob(["result"], { type: "image/png" })}
          filename="sensitive-original-name.png"
        />
      </ImageTransferProvider>,
    );

    const shareButton = await screen.findByRole("button", { name: "기기 공유 메뉴 열기" });
    fireEvent.click(shareButton);
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    const payload = share.mock.calls[0][0] as ShareData;
    expect(payload.files?.[0]?.name).toBe("pixelfit-result.png");
    expect(JSON.stringify(payload)).not.toContain("sensitive-original-name");
  });

  it("파일 공유 미지원 환경에는 가짜 공유 버튼을 표시하지 않는다", () => {
    render(
      <ImageTransferProvider>
        <NextToolActions
          sourceToolId="four-cut-photo"
          targetIds={["film-photo"]}
          asset={new Blob(["result"], { type: "image/jpeg" })}
          filename="result.jpg"
        />
      </ImageTransferProvider>,
    );
    expect(screen.queryByRole("button", { name: "기기 공유 메뉴 열기" })).not.toBeInTheDocument();
  });

  it("사용자가 공유 화면을 취소하면 실패 안내를 표시하지 않는다", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("사용자 취소", "AbortError"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn(() => true) });

    render(
      <ImageTransferProvider>
        <NextToolActions
          sourceToolId="four-cut-photo"
          targetIds={["film-photo"]}
          asset={new Blob(["result"], { type: "image/jpeg" })}
          filename="private-original.jpg"
        />
      </ImageTransferProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "기기 공유 메뉴 열기" }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(screen.queryByText(/공유를 완료하지 못했습니다/u)).not.toBeInTheDocument();
  });

  it("Web Share가 실패하면 다운로드 안내를 표시한다", async () => {
    const share = vi.fn().mockRejectedValue(new TypeError("share failed"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn(() => true) });

    render(
      <ImageTransferProvider>
        <NextToolActions
          sourceToolId="film-photo"
          targetIds={["four-cut-photo"]}
          asset={new Blob(["result"], { type: "image/png" })}
          filename="private-original.png"
        />
      </ImageTransferProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "기기 공유 메뉴 열기" }));
    expect(await screen.findByText("공유를 완료하지 못했습니다. 위의 결과 다운로드를 이용해 주세요.")).toBeVisible();
  });
});
