import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImagePreset } from "@/lib/presets";
import { defaultCropTransform } from "./geometry";

const mocks = vi.hoisted(() => ({
  decodeImage: vi.fn(),
  drawImageComposition: vi.fn(),
  replaceEdgeBackground: vi.fn(),
  verifyEncodedBlob: vi.fn(),
}));

vi.mock("./decode", () => ({ decodeImage: mocks.decodeImage }));
vi.mock("./draw", () => ({
  drawImageComposition: mocks.drawImageComposition,
  replaceEdgeBackground: mocks.replaceEdgeBackground,
}));
vi.mock("./encode", () => ({ verifyEncodedBlob: mocks.verifyEncodedBlob }));
vi.mock("./policy", () => ({ resolveBackgroundColor: () => null }));

import { exportPresetImage } from "./export";

describe("preset image export verification", () => {
  beforeEach(() => {
    mocks.verifyEncodedBlob.mockImplementation(async (
      blob: Blob,
      expected: { format: "jpeg" | "png"; width: number; height: number },
    ) => ({
      blob,
      bytes: new Uint8Array(await blob.arrayBuffer()),
      format: expected.format,
      width: expected.width,
      height: expected.height,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("verifies main-thread output before returning it", async () => {
    const close = vi.fn();
    const encoded = new Blob(["png"], { type: "image/png" });
    mocks.decodeImage.mockResolvedValue({ source: {}, width: 20, height: 10, close });
    vi.stubGlobal("Worker", undefined);
    vi.stubGlobal("OffscreenCanvas", undefined);
    vi.stubGlobal("createImageBitmap", undefined);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(encoded));

    const result = await exportPresetImage(
      new File(["source"], "source.png", { type: "image/png" }),
      makePreset(),
      { transform: defaultCropTransform, format: "png" },
    );

    expect(mocks.verifyEncodedBlob).toHaveBeenCalledWith(encoded, {
      format: "png",
      width: 2,
      height: 3,
      maxPixels: 40_000_000,
    });
    expect(result.blob).toBe(encoded);
    expect(close).toHaveBeenCalledOnce();
  });

  it("verifies Worker output and preserves the maximum-byte result", async () => {
    const encoded = new Blob(["larger"], { type: "image/png" });
    class TestWorker {
      onmessage: ((event: MessageEvent<{ type: "done"; blob: Blob }>) => void) | null = null;
      onerror: (() => void) | null = null;

      postMessage(): void {
        queueMicrotask(() => this.onmessage?.({ data: { type: "done", blob: encoded } } as MessageEvent<{ type: "done"; blob: Blob }>));
      }

      terminate(): void {}
    }
    vi.stubGlobal("Worker", TestWorker);
    vi.stubGlobal("OffscreenCanvas", class TestOffscreenCanvas {});
    vi.stubGlobal("createImageBitmap", vi.fn());

    const result = await exportPresetImage(
      new File(["source"], "source.png", { type: "image/png" }),
      makePreset({ maxBytes: 2 }),
      { transform: defaultCropTransform, format: "png" },
    );

    expect(mocks.verifyEncodedBlob).toHaveBeenCalledWith(encoded, {
      format: "png",
      width: 2,
      height: 3,
      maxPixels: 40_000_000,
    });
    expect(result.reachedTarget).toBe(false);
  });
});

function makePreset(output: { maxBytes?: number } = {}): ImagePreset {
  return {
    id: "test-photo",
    output: {
      width: 2,
      height: 3,
      formats: ["png"],
      ...output,
    },
    input: {
      formats: ["jpeg", "png", "webp"],
      maxBytes: 25 * 1024 ** 2,
      maxPixels: 40_000_000,
    },
  } as ImagePreset;
}
