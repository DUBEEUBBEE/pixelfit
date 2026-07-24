import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImageTransferProvider, useImageTransfer } from "./ImageTransferProvider";

function Harness() {
  const { offerTransfer, claimTransfer } = useImageTransfer();
  return <><button onClick={() => offerTransfer("source", "target", new Blob(["pixels"], { type: "image/png" }), "same.png")}>offer</button><button onClick={() => document.body.dataset.claimed = claimTransfer("target")?.name ?? "none"}>claim target</button><button onClick={() => document.body.dataset.other = claimTransfer("other")?.name ?? "none"}>claim other</button></>;
}

describe("ImageTransferProvider", () => {
  it("명시한 대상이 한 번만 현재 메모리의 파일을 받는다", async () => {
    const user = userEvent.setup();
    render(<ImageTransferProvider><Harness /></ImageTransferProvider>);
    await user.click(screen.getByRole("button", { name: "offer" }));
    await user.click(screen.getByRole("button", { name: "claim other" }));
    expect(document.body.dataset.other).toBe("none");
    await user.click(screen.getByRole("button", { name: "claim target" }));
    expect(document.body.dataset.claimed).toBe("same.png");
    await user.click(screen.getByRole("button", { name: "claim target" }));
    expect(document.body.dataset.claimed).toBe("none");
  });

  it("browser storage API를 호출하지 않는다", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    render(<ImageTransferProvider><Harness /></ImageTransferProvider>);
    await user.click(screen.getByRole("button", { name: "offer" }));
    expect(local).not.toHaveBeenCalled();
    local.mockRestore();
  });
});
