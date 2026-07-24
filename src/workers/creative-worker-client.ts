import type { CreativeWorkerRequest, CreativeWorkerResponse, CreativeWorkerResult } from "./creative-worker-protocol";

type WorkerPort = Pick<Worker, "postMessage" | "terminate"> & {
  onmessage: ((event: MessageEvent<CreativeWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
};

export type CreativeWorkerFactory = () => WorkerPort;

export class CreativeWorkerUnavailableError extends Error {
  constructor(message = "이 브라우저에서는 크리에이티브 이미지 워커를 시작할 수 없습니다.") {
    super(message);
    this.name = "CreativeWorkerUnavailableError";
  }
}

export function canUseCreativeImageWorker(scope: typeof globalThis = globalThis): boolean {
  const candidate = scope as typeof globalThis & {
    Worker?: typeof Worker;
    OffscreenCanvas?: typeof OffscreenCanvas;
    createImageBitmap?: typeof createImageBitmap;
  };
  return typeof candidate.Worker === "function"
    && typeof candidate.OffscreenCanvas === "function"
    && typeof candidate.OffscreenCanvas.prototype?.convertToBlob === "function"
    && typeof candidate.createImageBitmap === "function";
}

export function runCreativeImageWorker(
  request: CreativeWorkerRequest,
  options: {
    signal?: AbortSignal;
    onProgress?: (value: number) => void;
    createWorker?: CreativeWorkerFactory;
  } = {},
): Promise<CreativeWorkerResult> {
  if (options.signal?.aborted) return Promise.reject(abortError());

  let worker: WorkerPort;
  try {
    worker = (options.createWorker ?? createCreativeWorker)();
  } catch (error) {
    return Promise.reject(new CreativeWorkerUnavailableError(error instanceof Error ? error.message : undefined));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", onAbort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
      callback();
    };
    const onAbort = () => finish(() => reject(abortError()));

    worker.onmessage = (event) => {
      const message = event.data;
      if (message.type === "progress") {
        options.onProgress?.(message.value);
        return;
      }
      if (message.type === "done") {
        finish(() => resolve(message));
        return;
      }
      const error = message.code === "UNSUPPORTED"
        ? new CreativeWorkerUnavailableError(message.message)
        : new Error(message.message);
      finish(() => reject(error));
    };
    worker.onerror = (event) => finish(() => reject(new Error(event.message || "이미지 워커 실행에 실패했습니다.")));
    options.signal?.addEventListener("abort", onAbort, { once: true });

    try {
      worker.postMessage(request);
    } catch (error) {
      finish(() => reject(new CreativeWorkerUnavailableError(error instanceof Error ? error.message : undefined)));
    }
  });
}

function createCreativeWorker(): WorkerPort {
  return new Worker(new URL("./creative.worker.ts", import.meta.url), { type: "module" });
}

function abortError(): DOMException {
  return new DOMException("이미지 생성이 취소되었습니다.", "AbortError");
}
