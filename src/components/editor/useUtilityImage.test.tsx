import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUtilityImage, useUtilityProcessor } from "./useUtilityImage";

const imageMocks = vi.hoisted(() => ({
  close: vi.fn(),
  createBoundedPreviewBlob: vi.fn(),
  decodeImage: vi.fn(),
  validateImageFile: vi.fn(),
}));

vi.mock("@/lib/files/validation", () => ({ validateImageFile: imageMocks.validateImageFile }));
vi.mock("@/lib/image/decode", () => ({ decodeImage: imageMocks.decodeImage }));
vi.mock("@/lib/image/preview", () => ({ createBoundedPreviewBlob: imageMocks.createBoundedPreviewBlob }));

function ProcessorHarness({ onComplete }: { onComplete: (value: string | null) => void }) {
  const processor = useUtilityProcessor();
  return <>
    <button type="button" onClick={() => void processor.run(() => new Promise<string>((resolve) => { pendingResolve = resolve; })).then(onComplete)}>시작</button>
    <button type="button" onClick={processor.cancel}>취소</button>
    <span>{processor.busy ? "처리 중" : "대기"}</span>
  </>;
}

let pendingResolve: (value: string) => void = () => undefined;

describe("utility image byte retention", () => {
  const sourceBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);

  beforeEach(() => {
    imageMocks.close.mockClear();
    imageMocks.validateImageFile.mockResolvedValue({ type: "png", bytes: sourceBytes });
    imageMocks.decodeImage.mockResolvedValue({
      source: {} as CanvasImageSource,
      width: 640,
      height: 480,
      close: imageMocks.close,
    });
    imageMocks.createBoundedPreviewBlob.mockResolvedValue(new Blob(["preview"], { type: "image/png" }));
  });

  it("does not retain validated full bytes when the tool opts out", async () => {
    const view = renderHook(() => useUtilityImage({ retainBytes: false }));
    await act(async () => {
      await view.result.current.choose(new File(["image"], "source.png", { type: "image/png" }));
    });

    expect(view.result.current.asset).not.toHaveProperty("bytes");
  });

  it("retains validated full bytes only when explicitly requested", async () => {
    const view = renderHook(() => useUtilityImage({ retainBytes: true }));
    await act(async () => {
      await view.result.current.choose(new File(["image"], "source.png", { type: "image/png" }));
    });

    expect(view.result.current.asset?.bytes).toBe(sourceBytes);
  });
});

describe("utility processor cancellation", () => {
  it("discards a late task result after cancellation", async () => {
    let completed: string | null | undefined;
    render(<ProcessorHarness onComplete={(value) => { completed = value; }} />);
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    expect(screen.getByText("처리 중")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    await act(async () => { pendingResolve("늦은 결과"); });
    await waitFor(() => expect(completed).toBeNull());
    expect(screen.getByText("대기")).toBeInTheDocument();
  });
});
