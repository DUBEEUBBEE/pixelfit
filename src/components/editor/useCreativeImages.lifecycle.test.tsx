import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMultiCreativeImages } from "./useCreativeImages";

const close = vi.fn();
const previewBlob = new Blob(["bounded-preview"], { type: "image/jpeg" });

vi.mock("@/lib/files/validation", () => ({
  validateImageFile: vi.fn(async () => ({ type: "jpeg", bytes: new Uint8Array([0xff, 0xd8, 0xff]) })),
}));
vi.mock("@/lib/image/decode", () => ({
  decodeImage: vi.fn(async () => ({ source: {} as CanvasImageSource, width: 6000, height: 4000, close })),
}));
vi.mock("@/lib/image/preview", () => ({
  createBoundedPreviewBlob: vi.fn(async () => previewBlob),
}));

describe("creative preview resource lifecycle", () => {
  beforeEach(() => close.mockClear());

  it("closes each full-resolution decode after making a bounded preview and revokes its URL", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const view = renderHook(() => useMultiCreativeImages());
    const file = new File(["photo"], "large.jpg", { type: "image/jpeg" });
    await act(async () => { await view.result.current.chooseFiles([file]); });
    expect(close).toHaveBeenCalledTimes(1);
    expect(view.result.current.assets[0]).toMatchObject({ dimensions: { width: 6000, height: 4000 }, previewUrl: "blob:pixelfit-test" });
    view.unmount();
    expect(revoke).toHaveBeenCalledWith("blob:pixelfit-test");
    revoke.mockRestore();
  });
});
