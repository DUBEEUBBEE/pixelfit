import { describe, expect, it, vi } from "vitest";
import type { CreativeWorkerRequest, CreativeWorkerResponse } from "./creative-worker-protocol";
import { runCreativeImageWorker } from "./creative-worker-client";

class FakeWorker {
  onmessage: ((event: MessageEvent<CreativeWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  emit(message: CreativeWorkerResponse) {
    this.onmessage?.({ data: message } as MessageEvent<CreativeWorkerResponse>);
  }
}

const request: CreativeWorkerRequest = {
  kind: "film",
  file: new Blob(["photo"]),
  sourceWidth: 10,
  sourceHeight: 10,
  outputWidth: 10,
  outputHeight: 10,
  effects: { mode: "color", strength: 0, grain: 0, vignette: 0, lightLeak: 0 },
  dateText: "",
  format: "png",
  seed: 1,
};

describe("creative raster worker lifecycle", () => {
  it("terminates immediately and rejects with AbortError when cancelled", async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const result = runCreativeImageWorker(request, { signal: controller.signal, createWorker: () => worker });
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
    expect(worker.onerror).toBeNull();
  });

  it("reports progress and terminates after a successful result", async () => {
    const worker = new FakeWorker();
    const progress = vi.fn();
    const result = runCreativeImageWorker(request, { onProgress: progress, createWorker: () => worker });
    worker.emit({ type: "progress", value: 76 });
    const blob = new Blob(["result"], { type: "image/png" });
    worker.emit({ type: "done", blob, width: 10, height: 10, format: "png" });
    await expect(result).resolves.toMatchObject({ blob, width: 10, height: 10, format: "png" });
    expect(progress).toHaveBeenCalledWith(76);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
});
