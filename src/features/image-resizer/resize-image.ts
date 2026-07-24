import {
  createRasterCanvas,
  encodeAndVerifyCanvas,
  getRasterContext,
  verifyEncodedBlob,
  type ImageOutputFormat,
} from "@/lib/image/encode";
import {
  calculateFitPlan,
  validateResizeDimensions,
  type ResizeDimensions,
  type ResizeFit,
} from "@/lib/image/resize";

export type ResizeImageOptions = {
  /** Original local file used only for the worker path; never uploaded or persisted. */
  sourceFile?: Blob;
  output: ResizeDimensions;
  fit: ResizeFit;
  format: ImageOutputFormat;
  quality?: number;
  backgroundColor?: string;
  signal?: AbortSignal;
};

export type ResizedImageResult = {
  blob: Blob;
  format: ImageOutputFormat;
  width: number;
  height: number;
};

export async function resizeImageSource(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  options: ResizeImageOptions,
): Promise<ResizedImageResult> {
  validateResizeDimensions(sourceDimensions);
  const output = validateResizeDimensions(options.output);
  throwIfAborted(options.signal);
  const workerResult = await resizeInWorker(sourceDimensions, output, options);
  if (workerResult) return workerResult;
  return resizeLocally(source, sourceDimensions, output, options);
}

async function resizeInWorker(
  sourceDimensions: ResizeDimensions,
  output: ResizeDimensions,
  options: ResizeImageOptions,
): Promise<ResizedImageResult | null> {
  if (!options.sourceFile) return null;
  const workerApi = await import("@/workers/creative-worker-client");
  if (!workerApi.canUseCreativeImageWorker()) return null;
  try {
    const result = await workerApi.runCreativeImageWorker({
      kind: "resize",
      file: options.sourceFile,
      sourceWidth: sourceDimensions.width,
      sourceHeight: sourceDimensions.height,
      output,
      fit: options.fit,
      format: options.format,
      quality: options.quality,
      backgroundColor: options.backgroundColor,
    }, { signal: options.signal });
    if (result.details?.kind !== "resize") throw new Error("크기 조절 워커 결과 정보를 확인할 수 없습니다.");
    throwIfAborted(options.signal);
    const verified = await verifyEncodedBlob(result.blob, { format: options.format, width: output.width, height: output.height });
    throwIfAborted(options.signal);
    return { blob: verified.blob, format: verified.format, width: verified.width, height: verified.height };
  } catch (error) {
    if (error instanceof workerApi.CreativeWorkerUnavailableError) return null;
    throw error;
  }
}

async function resizeLocally(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  output: ResizeDimensions,
  options: ResizeImageOptions,
): Promise<ResizedImageResult> {
  const canvas = createRasterCanvas(output.width, output.height);
  const context = getRasterContext(canvas, { alpha: options.format !== "jpeg" });
  const background = options.format === "jpeg" ? (options.backgroundColor ?? "#ffffff") : options.backgroundColor;
  context.clearRect(0, 0, output.width, output.height);
  if (background && background !== "transparent") {
    context.fillStyle = background;
    context.fillRect(0, 0, output.width, output.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const plan = calculateFitPlan(sourceDimensions, output, options.fit);
  context.drawImage(
    source,
    plan.source.x,
    plan.source.y,
    plan.source.width,
    plan.source.height,
    plan.destination.x,
    plan.destination.y,
    plan.destination.width,
    plan.destination.height,
  );
  throwIfAborted(options.signal);
  const result = await encodeAndVerifyCanvas(canvas, {
    format: options.format,
    quality: options.quality,
    backgroundColor: options.backgroundColor,
    backgroundAlreadyApplied: options.format === "jpeg",
  });
  throwIfAborted(options.signal);
  return { blob: result.blob, format: result.format, width: result.width, height: result.height };
}

export function resizerOutputFilename(format: ImageOutputFormat): string {
  return `pixelfit-resized.${format === "jpeg" ? "jpg" : format}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("크기 조절이 취소되었습니다.", "AbortError");
}
