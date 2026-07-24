import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MAX_CREATIVE_TOTAL_PIXELS, useInitialCreativeFile, validateCreativeTotalPixels } from "./useCreativeImages";

function Harness({ file, onFile }: { file?: File; onFile: (file: File) => void }) {
  useInitialCreativeFile(file, onFile);
  return null;
}

describe("creative initial file handoff", () => {
  it("claims one file exactly once under React StrictMode", async () => {
    const onFile = vi.fn();
    const first = new File(["first"], "first.png", { type: "image/png" });
    const view = render(<StrictMode><Harness file={first} onFile={onFile} /></StrictMode>);
    await waitFor(() => expect(onFile).toHaveBeenCalledTimes(1));
    view.rerender(<StrictMode><Harness file={first} onFile={onFile} /></StrictMode>);
    await Promise.resolve();
    expect(onFile).toHaveBeenCalledTimes(1);
    const second = new File(["second"], "second.png", { type: "image/png" });
    view.rerender(<StrictMode><Harness file={second} onFile={onFile} /></StrictMode>);
    await waitFor(() => expect(onFile).toHaveBeenCalledTimes(2));
    expect(onFile).toHaveBeenLastCalledWith(second);
  });

  it("bounds the combined decoded pixel budget across four-cut inputs", () => {
    const one = validateCreativeTotalPixels(0, { width: 5000, height: 3000 });
    expect(one).toBe(15_000_000);
    expect(validateCreativeTotalPixels(one, { width: 5000, height: 3000 })).toBe(30_000_000);
    expect(() => validateCreativeTotalPixels(MAX_CREATIVE_TOTAL_PIXELS, { width: 1, height: 1 })).toThrow(/합산 해상도/);
  });
});
