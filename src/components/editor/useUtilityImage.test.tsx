import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUtilityProcessor } from "./useUtilityImage";

function ProcessorHarness({ onComplete }: { onComplete: (value: string | null) => void }) {
  const processor = useUtilityProcessor();
  return <>
    <button type="button" onClick={() => void processor.run(() => new Promise<string>((resolve) => { pendingResolve = resolve; })).then(onComplete)}>시작</button>
    <button type="button" onClick={processor.cancel}>취소</button>
    <span>{processor.busy ? "처리 중" : "대기"}</span>
  </>;
}

let pendingResolve: (value: string) => void = () => undefined;

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
