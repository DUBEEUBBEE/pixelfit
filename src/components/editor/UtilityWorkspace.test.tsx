import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageTransferProvider } from "@/components/session/ImageTransferProvider";

const useUtilityImageMock = vi.hoisted(() => vi.fn());

vi.mock("./useUtilityImage", () => ({
  useUtilityImage: useUtilityImageMock,
  useUtilityProcessor: () => ({
    busy: false,
    progress: 0,
    error: null,
    cancel: vi.fn(),
    run: vi.fn(),
    setError: vi.fn(),
  }),
  useUtilityResult: () => ({
    result: null,
    clearResult: vi.fn(),
    setResult: vi.fn(),
  }),
}));

import { UtilityWorkspace } from "./UtilityWorkspace";

describe("utility workspace source-byte retention", () => {
  beforeEach(() => {
    useUtilityImageMock.mockReset();
    useUtilityImageMock.mockReturnValue({
      asset: null,
      busy: false,
      error: null,
      setError: vi.fn(),
      choose: vi.fn(),
      reset: vi.fn(),
    });
  });

  it.each(["image-compressor", "image-resizer"])("%s explicitly disables source-byte retention", (presetId) => {
    render(<ImageTransferProvider><UtilityWorkspace presetId={presetId} /></ImageTransferProvider>);
    expect(useUtilityImageMock).toHaveBeenCalledWith({ retainBytes: false });
  });

  it("opts in to source bytes only for image-converter", () => {
    render(<ImageTransferProvider><UtilityWorkspace presetId="image-converter" /></ImageTransferProvider>);
    expect(useUtilityImageMock).toHaveBeenCalledWith({ retainBytes: true });
  });
});
