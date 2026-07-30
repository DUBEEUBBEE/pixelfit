import type { ImagePreset } from "@/lib/presets";
import { compressToTarget } from "./compression";
import { decodeImage } from "./decode";
import { setJpegDpi, setPngDpi } from "./dpi";
import { drawImageComposition, replaceEdgeBackground } from "./draw";
import { verifyEncodedBlob } from "./encode";
import type { CropTransform } from "./geometry";
import { resolveBackgroundColor } from "./policy";

export type ExportFormat = "jpeg" | "png";
export type ExportOptions = {
  transform: CropTransform;
  variant?: string;
  format: ExportFormat;
};
export type ExportResult = {
  blob: Blob;
  width: number;
  height: number;
  format: ExportFormat;
  quality?: number;
  reachedTarget: boolean;
};

export async function exportPresetImage(
  file: File,
  preset: ImagePreset,
  options: ExportOptions,
  signal?: AbortSignal,
  onProgress?: (value: number) => void,
): Promise<ExportResult> {
  if (!preset.output.width || !preset.output.height) throw new Error("이 프리셋에는 고정 이미지 출력 크기가 없습니다.");
  throwIfAborted(signal);
  onProgress?.(10);

  if (canUseWorker()) {
    try {
      const blob = await exportInWorker(file, preset, options, signal, onProgress);
      return finishVerifiedResult(blob, preset, options.format, true);
    } catch (error) {
      if (isAbortError(error)) throw error;
      // Worker support varies; the same private in-memory pipeline continues on the main thread.
    }
  }

  const decoded = await decodeImage(file, preset.input.maxPixels);
  onProgress?.(35);
  try {
    throwIfAborted(signal);
    const canvas = document.createElement("canvas");
    canvas.width = preset.output.width;
    canvas.height = preset.output.height;
    const context = canvas.getContext("2d", { alpha: options.format === "png" });
    if (!context) throw new Error("이 브라우저에서 이미지 캔버스를 만들 수 없습니다.");
    drawImageComposition(context, decoded.source, {
      outputWidth: canvas.width,
      outputHeight: canvas.height,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      transform: options.transform,
      mode: preset.id === "youtube-banner" ? "banner" : "photo",
      variant: options.variant,
    });
    const background = resolveBackgroundColor(preset, options.variant);
    if (background) replaceEdgeBackground(context, canvas.width, canvas.height, background);
    onProgress?.(65);
    throwIfAborted(signal);
    const encoded = await encodeCanvas(canvas, options.format, preset.output.maxBytes, preset.output.dpi, onProgress);
    return {
      ...await finishVerifiedResult(encoded.blob, preset, options.format, encoded.reachedTarget),
      quality: encoded.quality,
    };
  } finally {
    decoded.close();
  }
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  maxBytes?: number,
  dpi?: number,
  onProgress?: (value: number) => void,
): Promise<{ blob: Blob; reachedTarget: boolean; quality?: number }> {
  if (format === "png") {
    let blob = await canvasToBlob(canvas, "image/png");
    if (dpi) blob = await withDpi(blob, format, dpi);
    onProgress?.(100);
    return { blob, reachedTarget: !maxBytes || blob.size <= maxBytes };
  }
  const encode = async (quality: number) => {
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (dpi) blob = await withDpi(blob, format, dpi);
    return blob;
  };
  if (maxBytes) {
    const compressed = await compressToTarget(encode, maxBytes);
    onProgress?.(100);
    return compressed;
  }
  const blob = await encode(0.92);
  onProgress?.(100);
  return { blob, quality: 0.92, reachedTarget: true };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("이미지 인코딩에 실패했습니다. 브라우저 메모리를 확보한 뒤 다시 시도해 주세요."));
  }, type, quality));
}

async function withDpi(blob: Blob, format: ExportFormat, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const output = format === "jpeg" ? setJpegDpi(bytes, dpi) : setPngDpi(bytes, dpi);
  return new Blob([output as BlobPart], { type: blob.type });
}

function canUseWorker(): boolean {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function";
}

function exportInWorker(
  file: File,
  preset: ImagePreset,
  options: ExportOptions,
  signal?: AbortSignal,
  onProgress?: (value: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../workers/image.worker.ts", import.meta.url), { type: "module" });
    const abort = () => {
      worker.terminate();
      reject(new DOMException("처리가 취소되었습니다.", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ type: "progress"; value: number } | { type: "done"; blob: Blob } | { type: "error"; message: string }>) => {
      if (event.data.type === "progress") onProgress?.(event.data.value);
      if (event.data.type === "done") {
        signal?.removeEventListener("abort", abort);
        worker.terminate();
        withDpiIfNeeded(event.data.blob, options.format, preset.output.dpi).then(resolve, reject);
      }
      if (event.data.type === "error") {
        signal?.removeEventListener("abort", abort);
        worker.terminate();
        reject(new Error(event.data.message));
      }
    };
    worker.onerror = () => {
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      reject(new Error("Worker 처리에 실패했습니다."));
    };
    worker.postMessage({
      file,
      width: preset.output.width,
      height: preset.output.height,
      maxBytes: preset.output.maxBytes,
      mode: preset.id === "youtube-banner" ? "banner" : "photo",
      transform: options.transform,
      variant: options.variant,
      background: resolveBackgroundColor(preset, options.variant),
      format: options.format,
    });
  });
}

async function withDpiIfNeeded(blob: Blob, format: ExportFormat, dpi?: number): Promise<Blob> {
  return dpi ? withDpi(blob, format, dpi) : blob;
}

function finishResult(blob: Blob, preset: ImagePreset, format: ExportFormat, reachedTarget: boolean): ExportResult {
  return { blob, width: preset.output.width!, height: preset.output.height!, format, reachedTarget: reachedTarget && (!preset.output.maxBytes || blob.size <= preset.output.maxBytes) };
}

async function finishVerifiedResult(
  blob: Blob,
  preset: ImagePreset,
  format: ExportFormat,
  reachedTarget: boolean,
): Promise<ExportResult> {
  const verified = await verifyEncodedBlob(blob, {
    format,
    width: preset.output.width!,
    height: preset.output.height!,
    maxPixels: preset.input.maxPixels,
  });
  return finishResult(verified.blob, preset, format, reachedTarget);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("처리가 취소되었습니다.", "AbortError");
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
